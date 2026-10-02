export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="state" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBanner({ error, onRetry }) {
  return (
    <div className="banner banner--error" role="alert">
      <div>
        <strong>Something went wrong.</strong> {error?.message}
      </div>
      {onRetry && (
        <button type="button" className="btn btn--ghost btn--sm" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="state state--empty">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
