import { normalizeCadComponent } from "../../lib/cad"
import type { AxisDirection, CadComponentInput } from "../../types"

export function parseCadComponentInput(text: string): {
  value: CadComponentInput | null
  error: string | null
} {
  try {
    return { value: JSON.parse(text) as CadComponentInput, error: null }
  } catch (error) {
    return {
      value: null,
      error: error instanceof Error ? error.message : "Invalid JSON",
    }
  }
}

export function createUploadedCadComponent(
  file: File,
): Required<CadComponentInput> {
  const lowerName = file.name.toLowerCase()
  const modelBoardNormalDirection: AxisDirection =
    lowerName.endsWith(".glb") || lowerName.endsWith(".gltf") ? "y+" : "z+"

  return normalizeCadComponent({
    name: file.name.replace(/\.[^.]+$/, "") || file.name,
    description: `Uploaded model from ${file.name}`,
    model_obj_url: "",
    model_origin_position: { x: 0, y: 0, z: 0 },
    model_origin_alignment: "center_of_component_board_surface",
    model_board_normal_direction: modelBoardNormalDirection,
  })
}
