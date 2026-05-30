import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import {
  createCamera,
  createControls,
  createRenderer,
  fitRenderer,
  type HoverTarget,
} from "../lib/scene"

type ProjectionMode = "perspective" | "orthographic"
type ViewPreset = "side" | "front" | "top" | "corner"

export type SceneBuildResult = {
  hoverTargets?: HoverTarget[]
  overlayObjects?: THREE.Object3D[]
}

export type SceneBuildFn = (scene: THREE.Scene) => SceneBuildResult | void

export interface SceneCanvasProps {
  title: string
  subtitle: string
  up: THREE.Vector3
  buildScene: SceneBuildFn
}

function disposeScene(scene: THREE.Scene | null) {
  if (!scene) {
    return
  }

  scene.traverse((object: THREE.Object3D) => {
    if (!(object instanceof THREE.Mesh)) {
      return
    }

    object.geometry.dispose()
    if (Array.isArray(object.material)) {
      for (const material of object.material) {
        material.dispose()
      }
    } else {
      object.material.dispose()
    }
  })

  scene.clear()
}

export function SceneCanvas({
  title,
  subtitle,
  up,
  buildScene,
}: SceneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.Camera | null>(null)
  const controlsRef = useRef<ReturnType<typeof createControls> | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const overlaySceneRef = useRef<THREE.Scene | null>(null)
  const hoverTargetsRef = useRef<HoverTarget[]>([])
  const [projection, setProjection] = useState<ProjectionMode>("orthographic")
  const [viewPreset, setViewPreset] = useState<ViewPreset>("corner")
  const [hovered, setHovered] = useState<{
    x: number
    y: number
    lines: string[]
  } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const renderer = createRenderer(canvas)
    renderer.autoClear = false

    const createActiveCamera = () => {
      const direction = (() => {
        switch (viewPreset) {
          case "top":
            return up.clone().normalize()
          case "front":
            return new THREE.Vector3(0, 1, 0)
          case "side":
            return new THREE.Vector3(1, 0, 0)
          case "corner":
          default:
            return new THREE.Vector3(1, 1, 1).normalize()
        }
      })()
      const distance = 90

      if (projection === "orthographic") {
        const aspect = Math.max(
          canvas.clientWidth / Math.max(canvas.clientHeight, 1),
          1,
        )
        const frustum = 40
        const camera = new THREE.OrthographicCamera(
          -frustum * aspect,
          frustum * aspect,
          frustum,
          -frustum,
          0.1,
          1000,
        )
        camera.up.copy(up)
        camera.position.copy(direction.multiplyScalar(distance))
        return camera
      }

      const camera = createCamera(up)
      camera.position.copy(direction.multiplyScalar(distance))
      return camera
    }

    const camera = createActiveCamera()
    const controls = createControls(camera, canvas)
    const scene = new THREE.Scene()
    const overlayScene = new THREE.Scene()
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    rendererRef.current = renderer
    cameraRef.current = camera
    controlsRef.current = controls
    sceneRef.current = scene
    overlaySceneRef.current = overlayScene

    const resize = () => fitRenderer(renderer, camera, canvas)
    resize()

    const updateHover = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const intersections = raycaster.intersectObjects(
        hoverTargetsRef.current.map((target) => target.object),
        true,
      )

      if (intersections.length === 0) {
        setHovered(null)
        canvas.style.cursor = "default"
        return
      }

      const hit = hoverTargetsRef.current.find((target) =>
        intersections.some(
          (intersection) =>
            intersection.object === target.object ||
            target.object.children.includes(intersection.object),
        ),
      )

      if (!hit) {
        setHovered(null)
        canvas.style.cursor = "default"
        return
      }

      const projected = hit.position.clone().project(camera)
      setHovered({
        x: ((projected.x + 1) / 2) * rect.width,
        y: ((-projected.y + 1) / 2) * rect.height - 12,
        lines: hit.lines,
      })
      canvas.style.cursor = "pointer"
    }

    const onPointerMove = (event: PointerEvent) => {
      updateHover(event.clientX, event.clientY)
    }

    const onPointerLeave = () => {
      setHovered(null)
      canvas.style.cursor = "default"
    }

    canvas.addEventListener("pointermove", onPointerMove)
    canvas.addEventListener("pointerleave", onPointerLeave)

    let animationFrame = 0
    const render = () => {
      animationFrame = window.requestAnimationFrame(render)
      controls.update()
      renderer.clear()
      renderer.render(scene, camera)
      renderer.clearDepth()
      renderer.render(overlayScene, camera)
    }
    render()

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      observer.disconnect()
      canvas.removeEventListener("pointermove", onPointerMove)
      canvas.removeEventListener("pointerleave", onPointerLeave)
      controls.dispose()
      renderer.dispose()
      disposeScene(scene)
      disposeScene(overlayScene)
      hoverTargetsRef.current = []
      rendererRef.current = null
      cameraRef.current = null
      controlsRef.current = null
      sceneRef.current = null
      overlaySceneRef.current = null
    }
  }, [projection, up, viewPreset])

  useEffect(() => {
    const scene = sceneRef.current
    const overlayScene = overlaySceneRef.current
    if (!scene || !overlayScene) {
      return
    }

    disposeScene(scene)
    disposeScene(overlayScene)
    const buildResult = buildScene(scene)
    hoverTargetsRef.current = buildResult?.hoverTargets ?? []

    for (const object of buildResult?.overlayObjects ?? []) {
      overlayScene.add(object)
    }
  }, [buildScene, projection, up, viewPreset])

  return (
    <section className="viewport">
      <header className="viewport-header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="viewport-actions">
          <button
            type="button"
            className={viewPreset === "side" ? "is-active" : undefined}
            onClick={() => setViewPreset("side")}
          >
            Side
          </button>
          <button
            type="button"
            className={viewPreset === "front" ? "is-active" : undefined}
            onClick={() => setViewPreset("front")}
          >
            Front
          </button>
          <button
            type="button"
            className={viewPreset === "top" ? "is-active" : undefined}
            onClick={() => setViewPreset("top")}
          >
            Top
          </button>
          <button
            type="button"
            className={viewPreset === "corner" ? "is-active" : undefined}
            onClick={() => setViewPreset("corner")}
          >
            Corner
          </button>
          <button
            type="button"
            className="projection-toggle"
            onClick={() =>
              setProjection((current) =>
                current === "perspective" ? "orthographic" : "perspective",
              )
            }
          >
            {projection === "perspective" ? "Orthographic" : "Perspective"}
          </button>
        </div>
      </header>
      <div className="viewport-body">
        <canvas ref={canvasRef} />
        {hovered ? (
          <div
            className="hover-label"
            style={{ left: hovered.x, top: hovered.y }}
          >
            {hovered.lines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
