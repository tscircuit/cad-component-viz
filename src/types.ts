export type AxisDirection = "x+" | "x-" | "y+" | "y-" | "z+" | "z-";

export type Alignment = "center" | "center_of_component_board_surface";

export interface Vec3Input {
	x: number;
	y: number;
	z: number;
}

export interface ModelBoundsInput {
	width: number;
	height: number;
	depth: number;
}

export interface CadComponentInput {
	name?: string;
	description?: string;
	model_obj_url?: string;
	model_bounds?: ModelBoundsInput;
	board_thickness?: number;
	model_board_normal_direction?: AxisDirection;
	model_origin_alignment?: Alignment;
	model_origin_position?: Vec3Input;
	anchor_alignment?: Alignment;
	position?: Vec3Input;
}
