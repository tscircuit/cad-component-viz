export function LoadingViewport({
  message,
  progress,
}: {
  message: string
  progress: number | null
}) {
  return (
    <section className="viewport viewport-loading">
      <div className="viewport-loading-body">
        <div className="viewport-loading-card">
          <strong>Loading model</strong>
          <span>{message}</span>
          {progress === null ? null : (
            <div
              className="loading-progress"
              aria-label={`Model load progress ${Math.round(progress * 100)}%`}
            >
              <div style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
