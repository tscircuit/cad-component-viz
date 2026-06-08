import * as THREE from "three"
import type { LoadedModel, ModelFormat } from "./cad"
import type {
  ModelParserRequest,
  ModelParserResponse,
  SerializedLoadedModel,
} from "../workers/modelParserTypes"

interface WorkerParseOptions {
  signal?: AbortSignal
}

function createAbortError() {
  return new DOMException("Model parse aborted.", "AbortError")
}

function reviveLoadedModel(serialized: SerializedLoadedModel): LoadedModel {
  const geometry = new THREE.BufferGeometryLoader().parse(
    serialized.geometryJson,
  )
  const object = new THREE.ObjectLoader().parse(serialized.objectJson)
  geometry.computeBoundingBox()
  return {
    geometry,
    object,
  }
}

export function parseModelFromBufferInWorker(
  content: ArrayBuffer,
  format: ModelFormat | null,
  { signal }: WorkerParseOptions = {},
): Promise<{ model: LoadedModel; format: ModelFormat }> {
  if (signal?.aborted) {
    return Promise.reject(createAbortError())
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("../workers/modelParser.worker.ts", import.meta.url),
      { type: "module" },
    )
    let settled = false

    const cleanup = () => {
      signal?.removeEventListener("abort", onAbort)
      worker.terminate()
    }
    const finish = (action: () => void) => {
      if (settled) {
        return
      }
      settled = true
      cleanup()
      action()
    }
    const onAbort = () => {
      finish(() => reject(createAbortError()))
    }

    worker.addEventListener(
      "message",
      (event: MessageEvent<ModelParserResponse>) => {
        const response = event.data
        if (response.type === "error") {
          finish(() => reject(new Error(response.message)))
          return
        }

        finish(() =>
          resolve({
            model: reviveLoadedModel(response.model),
            format: response.format,
          }),
        )
      },
    )
    worker.addEventListener("error", (event) => {
      finish(() => reject(new Error(event.message)))
    })
    signal?.addEventListener("abort", onAbort, { once: true })

    worker.postMessage(
      {
        content,
        format,
      } satisfies ModelParserRequest,
      [content],
    )
  })
}
