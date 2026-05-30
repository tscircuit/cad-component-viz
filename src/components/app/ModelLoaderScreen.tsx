import type { ChangeEvent } from "react"
import type { UseCadComponentEditorResult } from "../../hooks/useCadComponentEditor"

interface ModelLoaderScreenProps {
  editor: UseCadComponentEditorResult
}

export function ModelLoaderScreen({ editor }: ModelLoaderScreenProps) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    if (file) {
      editor.loadDroppedModel(file)
    }
    event.target.value = ""
  }

  return (
    <main className="landing-shell">
      <section className="landing-card">
        <h1>Load a CAD model</h1>
        <p className="landing-lede">
          Drop a model file to open it in the viewer, or load the demo model.
        </p>
        <div
          className={`dropzone ${editor.isDragActive ? "active" : ""}`}
          {...editor.dropTargetProps}
        >
          <div className="dropzone-copy">
            <strong>Drag and drop a model</strong>
            <span>Supports OBJ, STEP, STP, GLTF, and GLB.</span>
          </div>
          <div className="landing-actions">
            <button
              type="button"
              className="button-primary"
              onClick={editor.openLandingFilePicker}
            >
              Choose model
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={editor.loadDemoModel}
            >
              Load demo
            </button>
          </div>
          <input
            ref={editor.landingFileInputRef}
            className="sr-only-input"
            type="file"
            accept=".obj,.step,.stp,.gltf,.glb"
            onChange={handleFileChange}
          />
        </div>
      </section>
    </main>
  )
}
