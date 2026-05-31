import { useEffect, useState } from "react"
import {
  detectModelFormat,
  disposeModelObject,
  parseModelFromBuffer,
  parseModelFromUnknownBuffer,
  parseModelFromUrl,
} from "../lib/cad"
import { getCadGeometryIdleMessage } from "../app/utils/modelSourceMessageUtils"
import type { CadGeometryState, ModelSource } from "../app/types"

function formatProgressMessage(
  formatLabel: string,
  loaded: number,
  total: number | null,
) {
  if (total && total > 0) {
    return `Downloading ${formatLabel} model ${Math.round((loaded / total) * 100)}%...`
  }

  const loadedMb = loaded / (1024 * 1024)
  return `Downloading ${formatLabel} model ${loadedMb.toFixed(1)} MB...`
}

export function useCadGeometry(source: ModelSource): CadGeometryState {
  const [state, setState] = useState<CadGeometryState>({
    model: null,
    status: source.kind === "none" ? "fallback" : "loading",
    message: getCadGeometryIdleMessage(source),
    progress: null,
  })

  useEffect(() => {
    let disposed = false

    if (source.kind === "none") {
      setState({
        model: null,
        status: "fallback",
        message: "Using fallback box from size.",
        progress: null,
      })
      return
    }

    const sourceName = source.kind === "file" ? source.file.name : source.value
    const format = detectModelFormat(sourceName)
    const formatLabel = format?.toUpperCase() ?? "model"

    setState({
      model: null,
      status: "loading",
      message: format
        ? `Loading ${formatLabel} model...`
        : "Loading model and detecting format...",
      progress: null,
    })

    const controller = new AbortController()
    const loadGeometry = async () => {
      if (source.kind === "url" && format) {
        return {
          model: await parseModelFromUrl(source.value, format, {
            signal: controller.signal,
            onProgress: ({ loaded, total }) => {
              if (disposed || controller.signal.aborted) {
                return
              }
              setState((current) => ({
                ...current,
                status: "loading",
                message: formatProgressMessage(formatLabel, loaded, total),
                progress: total && total > 0 ? loaded / total : null,
              }))
            },
          }),
          format,
        }
      }

      const buffer =
        source.kind === "file"
          ? await source.file.arrayBuffer()
          : await fetch(source.value, { signal: controller.signal }).then(
              async (response) => {
                if (!response.ok) {
                  throw new Error(`Failed to fetch model (${response.status})`)
                }

                return response.arrayBuffer()
              },
            )

      if (format) {
        if (source.kind === "file") {
          setState((current) => ({
            ...current,
            status: "loading",
            message: `Parsing ${formatLabel} model...`,
            progress: null,
          }))
        }
        return { model: await parseModelFromBuffer(buffer, format), format }
      }

      setState((current) => ({
        ...current,
        status: "loading",
        message: "Detecting model format...",
        progress: null,
      }))
      return parseModelFromUnknownBuffer(buffer)
    }

    loadGeometry()
      .then(({ model, format: resolvedFormat }) => {
        if (disposed) {
          model.geometry.dispose()
          disposeModelObject(model.object)
          return
        }

        setState({
          model,
          status: "ready",
          progress: null,
          message:
            source.kind === "file"
              ? `${resolvedFormat.toUpperCase()} loaded from ${source.file.name}.`
              : `${resolvedFormat.toUpperCase()} loaded successfully.`,
        })
      })
      .catch((error: unknown) => {
        if (disposed || controller.signal.aborted) {
          return
        }

        setState({
          model: null,
          status: "fallback",
          progress: null,
          message:
            error instanceof Error
              ? `${error.message}. Falling back to size box.`
              : "Failed to load model. Falling back to size box.",
        })
      })

    return () => {
      disposed = true
      controller.abort()
    }
  }, [source])

  useEffect(
    () => () => {
      state.model?.geometry.dispose()
      disposeModelObject(state.model?.object ?? null)
    },
    [state.model],
  )

  return state
}
