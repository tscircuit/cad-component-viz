import type { ModelFormat } from "../lib/cad"

export interface SerializedLoadedModel {
  geometryJson: unknown
  objectJson: unknown
}

export interface ModelParserRequest {
  content: ArrayBuffer
  format: ModelFormat | null
}

export type ModelParserResponse =
  | {
      type: "success"
      format: ModelFormat
      model: SerializedLoadedModel
    }
  | {
      type: "error"
      message: string
    }
