import { detectModelFormat } from "../../lib/cad"
import type { ModelSource } from "../types"

export function getCadGeometryIdleMessage(source: ModelSource): string {
  if (source.kind === "none") {
    return "Using fallback box from size."
  }

  const format = detectModelFormat(
    source.kind === "file" ? source.file.name : source.value,
  )

  if (!format) {
    return "Loading model and detecting format..."
  }

  return `Loading ${format.toUpperCase()} model...`
}
