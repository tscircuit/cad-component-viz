import type { LoadedModel } from "../lib/cad"

export type ModelSource =
  | { kind: "none" }
  | { kind: "url"; value: string }
  | { kind: "file"; file: File }

export type AppMode = "landing" | "workspace"

export type CadGeometryStatus = "idle" | "loading" | "ready" | "fallback"

export interface CadGeometryState {
  model: LoadedModel | null
  status: CadGeometryStatus
  message: string
}
