import {
  disposeModelObject,
  parseModelFromBuffer,
  parseModelFromUnknownBuffer,
} from "../lib/cad"
import type {
  ModelParserRequest,
  ModelParserResponse,
  SerializedLoadedModel,
} from "./modelParserTypes"

function serializeLoadedModel(
  model: Awaited<ReturnType<typeof parseModelFromBuffer>>,
): SerializedLoadedModel {
  return {
    geometryJson: model.geometry.toJSON(),
    objectJson: model.object.toJSON(),
  }
}

self.addEventListener(
  "message",
  async (event: MessageEvent<ModelParserRequest>) => {
    try {
      const { content, format } = event.data
      const result = format
        ? {
            model: await parseModelFromBuffer(content, format),
            format,
          }
        : await parseModelFromUnknownBuffer(content)
      const serialized = serializeLoadedModel(result.model)

      result.model.geometry.dispose()
      disposeModelObject(result.model.object)

      self.postMessage({
        type: "success",
        format: result.format,
        model: serialized,
      } satisfies ModelParserResponse)
    } catch (error: unknown) {
      self.postMessage({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to parse model.",
      } satisfies ModelParserResponse)
    }
  },
)
