import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
	ALIGNMENT_OPTIONS,
	NORMAL_OPTIONS,
	buildFallbackGeometry,
	computePlacement,
	describeRotation,
	directionToVector,
	normalizeCadComponent,
	parseOBJ,
} from "./lib/cad";
import {
	addDefaultLights,
	createCamera,
	createControls,
	createRenderer,
	fitRenderer,
	makeAxes,
	makeBoard,
	makeBoardNormalArrow,
	makeGrid,
	makeOriginMarker,
} from "./lib/scene";
import { SAMPLE_CAD_COMPONENT } from "./sampleCadComponent";
import type { CadComponentInput } from "./types";

function parseInput(text: string): {
	value: CadComponentInput | null;
	error: string | null;
} {
	try {
		return { value: JSON.parse(text) as CadComponentInput, error: null };
	} catch (error) {
		return {
			value: null,
			error: error instanceof Error ? error.message : "Invalid JSON",
		};
	}
}

function useCadGeometry(modelUrl: string, fallback: THREE.BufferGeometry) {
	const [state, setState] = useState<{
		geometry: THREE.BufferGeometry;
		status: "idle" | "loading" | "ready" | "fallback";
		message: string;
	}>({
		geometry: fallback,
		status: modelUrl ? "loading" : "fallback",
		message: modelUrl
			? "Loading OBJ model..."
			: "Using fallback box from model_bounds.",
	});

	useEffect(() => {
		let disposed = false;
		const fallbackClone = fallback.clone();

		if (!modelUrl) {
			setState({
				geometry: fallbackClone,
				status: "fallback",
				message: "Using fallback box from model_bounds.",
			});
			return () => {
				fallbackClone.dispose();
			};
		}

		setState({
			geometry: fallbackClone,
			status: "loading",
			message: "Loading OBJ model...",
		});

		const controller = new AbortController();
		fetch(modelUrl, { signal: controller.signal })
			.then(async (response) => {
				if (!response.ok) {
					throw new Error(`Failed to fetch OBJ (${response.status})`);
				}
				return parseOBJ(await response.text());
			})
			.then((geometry) => {
				if (disposed) {
					geometry.dispose();
					return;
				}
				setState({
					geometry,
					status: "ready",
					message: "OBJ loaded successfully.",
				});
				fallbackClone.dispose();
			})
			.catch((error: unknown) => {
				if (disposed || controller.signal.aborted) {
					return;
				}
				setState({
					geometry: fallbackClone,
					status: "fallback",
					message:
						error instanceof Error
							? `${error.message}. Falling back to model_bounds box.`
							: "Failed to load OBJ. Falling back to model_bounds box.",
				});
			});

		return () => {
			disposed = true;
			controller.abort();
		};
	}, [fallback, modelUrl]);

	useEffect(() => () => state.geometry.dispose(), [state.geometry]);

	return state;
}

function SceneCanvas({
	title,
	subtitle,
	up,
	buildScene,
}: {
	title: string;
	subtitle: string;
	up: THREE.Vector3;
	buildScene: (scene: THREE.Scene) => void;
}) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}

		const renderer = createRenderer(canvas);
		const camera = createCamera(up);
		const controls = createControls(camera, canvas);
		const scene = new THREE.Scene();
		buildScene(scene);

		const resize = () => fitRenderer(renderer, camera, canvas);
		resize();

		let animationFrame = 0;
		const render = () => {
			animationFrame = window.requestAnimationFrame(render);
			controls.update();
			renderer.render(scene, camera);
		};
		render();

		const observer = new ResizeObserver(resize);
		observer.observe(canvas);

		return () => {
			window.cancelAnimationFrame(animationFrame);
			observer.disconnect();
			controls.dispose();
			renderer.dispose();
			scene.traverse((object: THREE.Object3D) => {
				if (object instanceof THREE.Mesh) {
					object.geometry.dispose();
					if (Array.isArray(object.material)) {
						for (const material of object.material) {
							material.dispose();
						}
					} else {
						object.material.dispose();
					}
				}
			});
		};
	}, [buildScene, up]);

	return (
		<section className="viewport">
			<header className="viewport-header">
				<div>
					<h2>{title}</h2>
					<p>{subtitle}</p>
				</div>
			</header>
			<canvas ref={canvasRef} />
		</section>
	);
}

function App() {
	const [editorValue, setEditorValue] = useState(() =>
		JSON.stringify(SAMPLE_CAD_COMPONENT, null, 2),
	);

	const parsed = useMemo(() => parseInput(editorValue), [editorValue]);
	const cad = useMemo(
		() => normalizeCadComponent(parsed.value ?? SAMPLE_CAD_COMPONENT),
		[parsed.value],
	);
	const fallbackGeometry = useMemo(() => buildFallbackGeometry(cad), [cad]);
	const { geometry, status, message } = useCadGeometry(
		cad.model_obj_url,
		fallbackGeometry,
	);
	const placement = useMemo(() => computePlacement(cad), [cad]);
	const modelUp = useMemo(
		() => directionToVector(cad.model_board_normal_direction),
		[cad.model_board_normal_direction],
	);

	const modelScene = useMemo(
		() => (scene: THREE.Scene) => {
			addDefaultLights(scene);
			scene.add(makeGrid(90, 36, cad.model_board_normal_direction));
			scene.add(makeAxes(22));
			scene.add(
				new THREE.Mesh(
					geometry.clone(),
					new THREE.MeshPhongMaterial({
						color: 0x79a8ff,
						transparent: true,
						opacity: 0.84,
						side: THREE.DoubleSide,
					}),
				),
			);
			scene.add(makeOriginMarker(placement.modelOrigin, 0xff8a4d));
			scene.add(
				makeBoardNormalArrow(
					placement.modelOrigin,
					cad.model_board_normal_direction,
				),
			);
		},
		[cad.model_board_normal_direction, geometry, placement.modelOrigin],
	);

	const boardScene = useMemo(
		() => (scene: THREE.Scene) => {
			addDefaultLights(scene);
			scene.add(makeGrid(90, 36, "z+"));
			scene.add(makeAxes(24));
			scene.add(makeBoard(cad.board_thickness));

			const placed = new THREE.Group();
			placed.rotation.copy(placement.rotation);
			placed.position.copy(placement.translation);
			placed.add(
				new THREE.Mesh(
					geometry.clone(),
					new THREE.MeshPhongMaterial({
						color: 0x7dd3a7,
						transparent: true,
						opacity: 0.84,
						side: THREE.DoubleSide,
					}),
				),
			);
			scene.add(placed);
			scene.add(
				makeOriginMarker(
					new THREE.Vector3(cad.position.x, cad.position.y, cad.position.z),
					0x57f287,
				),
			);
		},
		[
			cad.board_thickness,
			cad.position.x,
			cad.position.y,
			cad.position.z,
			geometry,
			placement.rotation,
			placement.translation,
		],
	);

	const statusClass =
		status === "ready" ? "ok" : status === "loading" ? "loading" : "warning";

	return (
		<main className="app-shell">
			<aside className="sidebar">
				<div className="hero">
					<p className="eyebrow">Circuit JSON</p>
					<h1>`cad_component` visualizer</h1>
					<p className="lede">
						Paste a `cad_component` payload and compare model-space orientation
						against board-space placement.
					</p>
				</div>

				<div className={`status-pill ${statusClass}`}>{message}</div>
				{parsed.error ? (
					<div className="status-pill error">
						JSON parse error: {parsed.error}
					</div>
				) : null}

				<div className="actions">
					<button
						type="button"
						onClick={() =>
							setEditorValue(JSON.stringify(SAMPLE_CAD_COMPONENT, null, 2))
						}
					>
						Reset sample
					</button>
				</div>

				<label className="field">
					<span>cad_component JSON</span>
					<textarea
						value={editorValue}
						onChange={(event) => setEditorValue(event.target.value)}
						spellCheck={false}
					/>
				</label>

				<section className="info-card">
					<h2>Interpretation</h2>
					<dl>
						<div>
							<dt>Model normal</dt>
							<dd>{cad.model_board_normal_direction}</dd>
						</div>
						<div>
							<dt>Rotate to board z+</dt>
							<dd>{describeRotation(cad.model_board_normal_direction)}</dd>
						</div>
						<div>
							<dt>Model origin</dt>
							<dd>
								({cad.model_origin_position.x}, {cad.model_origin_position.y},{" "}
								{cad.model_origin_position.z})
							</dd>
						</div>
						<div>
							<dt>Rotated origin</dt>
							<dd>
								({placement.rotatedOrigin.x.toFixed(2)},{" "}
								{placement.rotatedOrigin.y.toFixed(2)},{" "}
								{placement.rotatedOrigin.z.toFixed(2)})
							</dd>
						</div>
						<div>
							<dt>Translation</dt>
							<dd>
								({placement.translation.x.toFixed(2)},{" "}
								{placement.translation.y.toFixed(2)},{" "}
								{placement.translation.z.toFixed(2)})
							</dd>
						</div>
					</dl>
				</section>

				<section className="info-card">
					<h2>Current fields</h2>
					<ul className="chip-list">
						<li>{cad.model_origin_alignment}</li>
						<li>{cad.anchor_alignment}</li>
						<li>board {cad.board_thickness.toFixed(2)} mm</li>
						<li>{cad.model_obj_url ? "remote OBJ" : "fallback box"}</li>
					</ul>
				</section>

				<section className="info-card">
					<h2>Allowed enum values</h2>
					<p>{NORMAL_OPTIONS.join(", ")}</p>
					<p>{ALIGNMENT_OPTIONS.join(", ")}</p>
				</section>
			</aside>

			<section className="viewports">
				<SceneCanvas
					title="Model space"
					subtitle={`${cad.model_board_normal_direction} is treated as board-up in the raw model.`}
					up={modelUp}
					buildScene={modelScene}
				/>
				<SceneCanvas
					title="Board space"
					subtitle="The component is rotated into z+ and translated onto the board."
					up={new THREE.Vector3(0, 0, 1)}
					buildScene={boardScene}
				/>
			</section>
		</main>
	);
}

export default App;
