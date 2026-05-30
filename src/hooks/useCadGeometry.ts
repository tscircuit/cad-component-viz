import { useEffect, useState } from "react"
import {
  detectModelFormat,
  disposeModelObject,
  parseModelFromBuffer,
  parseModelFromUnknownBuffer,
  parseModelFromUrl,
} from "../lib/cad"
import { getCadGeometryIdleMessage } from "../app/utils/modelSourceMessageUtils"
import type { CadGeometryState, ModelSource } from "../app/types"

export function useCadGeometry(source: ModelSource): CadGeometryState {
  const [state, setState] = useState<CadGeometryState>({
    model: null,
    status: source.kind === "none" ? "fallback" : "loading",
    message: getCadGeometryIdleMessage(source),
  })

  useEffect(() => {
    let disposed = false

    if (source.kind === "none") {
      setState({
        model: null,
        status: "fallback",
        message: "Using fallback box from size.",
      })
      return
    }

    const sourceName = source.kind === "file" ? source.file.name : source.value
    const format = detectModelFormat(sourceName)

    setState({
      model: null,
      status: "loading",
      message: format
        ? `Loading ${format.toUpperCase()} model...`
        : "Loading model and detecting format...",
    })

    const controller = new AbortController()
    const loadGeometry = async () => {
      if (source.kind === "url" && format) {
        return {
          model: await parseModelFromUrl(source.value, format),
          format,
        }
      }

      const buffer =
        source.kind === "file"
          ? await source.file.arrayBuffer()
          : await fetch(source.value, { signal: controller.signal }).then(
              async (response) => {
                if (!response.ok) {
                  throw new Error(`Failed to fetch model (${response.status})`)
                }

                return response.arrayBuffer()
              },
            )

      if (format) {
        return { model: await parseModelFromBuffer(buffer, format), format }
      }

      return parseModelFromUnknownBuffer(buffer)
    }

    loadGeometry()
      .then(({ model, format: resolvedFormat }) => {
        if (disposed) {
          model.geometry.dispose()
          disposeModelObject(model.object)
          return
        }

        setState({
          model,
          status: "ready",
          message:
            source.kind === "file"
              ? `${resolvedFormat.toUpperCase()} loaded from ${source.file.name}.`
              : `${resolvedFormat.toUpperCase()} loaded successfully.`,
        })
      })
      .catch((error: unknown) => {
        if (disposed || controller.signal.aborted) {
          return
        }

        setState({
          model: null,
          status: "fallback",
          message:
            error instanceof Error
              ? `${error.message}. Falling back to size box.`
              : "Failed to load model. Falling back to size box.",
        })
      })

    return () => {
      disposed = true
      controller.abort()
    }
  }, [source])

  useEffect(
    () => () => {
      state.model?.geometry.dispose()
      disposeModelObject(state.model?.object ?? null)
    },
    [state.model],
  )

  return state
}
