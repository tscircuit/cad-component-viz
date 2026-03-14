import type { CadComponentInput } from "./types";

export const SAMPLE_CAD_COMPONENT: CadComponentInput = {
	name: "Sample USB-C Connector",
	description:
		"Useful for checking how model-space UP maps onto board-space Z+.",
	model_obj_url:
		"https://modelcdn.tscircuit.com/easyeda_models/download?uuid=4e90b6d8552a4e058d9ebe9d82e11f3a&pn=C9900017879",
	model_bounds: {
		width: 17.78,
		height: 45.3174,
		depth: 16.25,
	},
	board_thickness: 1.6,
	model_board_normal_direction: "y+",
	model_origin_alignment: "center_of_component_board_surface",
	model_origin_position: {
		x: 0,
		y: -1.07,
		z: -2.5,
	},
	anchor_alignment: "center_of_component_board_surface",
	position: {
		x: 0,
		y: 0,
		z: 0.8,
	},
};
