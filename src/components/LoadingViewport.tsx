export function LoadingViewport({ message }: { message: string }) {
  return (
    <section className="viewport viewport-loading">
      <div className="viewport-loading-body">
        <div className="viewport-loading-card">
          <strong>Loading model</strong>
          <span>{message}</span>
        </div>
      </div>
    </section>
  )
}
