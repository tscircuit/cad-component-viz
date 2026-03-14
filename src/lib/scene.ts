import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DIR_VEC } from "./cad";
import type { AxisDirection } from "../types";

export function createRenderer(canvas: HTMLCanvasElement) {
	const renderer = new THREE.WebGLRenderer({
		antialias: true,
		canvas,
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setClearColor("#08111f");
	return renderer;
}

export function createCamera(up: THREE.Vector3) {
	const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
	camera.up.copy(up);
	camera.position.set(52, 42, 38);
	return camera;
}

export function createControls(
	camera: THREE.PerspectiveCamera,
	canvas: HTMLCanvasElement,
) {
	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true;
	controls.target.set(0, 0, 0);
	return controls;
}

export function fitRenderer(
	renderer: THREE.WebGLRenderer,
	camera: THREE.PerspectiveCamera,
	canvas: HTMLCanvasElement,
) {
	const { clientWidth, clientHeight } = canvas;
	if (clientWidth === 0 || clientHeight === 0) {
		return;
	}
	renderer.setSize(clientWidth, clientHeight, false);
	camera.aspect = clientWidth / clientHeight;
	camera.updateProjectionMatrix();
}

export function makeGrid(
	size: number,
	divisions: number,
	normal: AxisDirection,
) {
	const grid = new THREE.GridHelper(size, divisions, 0x42608a, 0x1a2740);
	if (normal === "z+" || normal === "z-") {
		grid.rotation.x = Math.PI / 2;
	} else if (normal === "x+" || normal === "x-") {
		grid.rotation.z = Math.PI / 2;
	}
	return grid;
}

export function makeAxes(length = 20) {
	const group = new THREE.Group();
	const axes = [
		{ name: "X", direction: new THREE.Vector3(1, 0, 0), color: 0xff5d73 },
		{ name: "Y", direction: new THREE.Vector3(0, 1, 0), color: 0x5dff97 },
		{ name: "Z", direction: new THREE.Vector3(0, 0, 1), color: 0x5da9ff },
	];

	for (const axis of axes) {
		const points = [
			new THREE.Vector3(0, 0, 0),
			axis.direction.clone().multiplyScalar(length),
		];
		const line = new THREE.Line(
			new THREE.BufferGeometry().setFromPoints(points),
			new THREE.LineBasicMaterial({ color: axis.color }),
		);
		group.add(line);
	}

	return group;
}

export function makeBoard(boardThickness: number) {
	return new THREE.Mesh(
		new THREE.BoxGeometry(56, 56, boardThickness),
		new THREE.MeshPhongMaterial({
			color: 0x1d7b4f,
			transparent: true,
			opacity: 0.82,
		}),
	);
}

export function makeOriginMarker(position: THREE.Vector3, color: number) {
	const group = new THREE.Group();
	const sphere = new THREE.Mesh(
		new THREE.SphereGeometry(0.95, 24, 24),
		new THREE.MeshStandardMaterial({
			color,
			emissive: color,
			emissiveIntensity: 0.35,
		}),
	);
	sphere.position.copy(position);
	group.add(sphere);

	const ring = new THREE.Mesh(
		new THREE.TorusGeometry(1.65, 0.14, 16, 40),
		new THREE.MeshBasicMaterial({ color }),
	);
	ring.position.copy(position);
	group.add(ring);
	return group;
}

export function makeBoardNormalArrow(
	origin: THREE.Vector3,
	direction: AxisDirection,
) {
	const vector = DIR_VEC[direction];
	const directionVector = new THREE.Vector3(
		vector[0],
		vector[1],
		vector[2],
	).normalize();
	return new THREE.ArrowHelper(directionVector, origin, 16, 0xffcf5c, 2.8, 1.2);
}

export function addDefaultLights(scene: THREE.Scene) {
	scene.add(new THREE.AmbientLight(0xffffff, 0.85));

	const key = new THREE.DirectionalLight(0xffffff, 1.25);
	key.position.set(18, 24, 30);
	scene.add(key);

	const fill = new THREE.DirectionalLight(0x90bfff, 0.45);
	fill.position.set(-20, -10, 18);
	scene.add(fill);
}
