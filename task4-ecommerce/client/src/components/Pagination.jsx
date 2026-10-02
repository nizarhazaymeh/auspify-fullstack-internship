export default function Pagination({ page, pages, total, limit, onChange }) {
  if (total === 0) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="pagination__info">
        Showing {from}–{to} of {total}
      </span>
      <div className="pagination__controls">
        <button type="button" className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          ← Prev
        </button>
        <span className="pagination__page">
          Page {page} of {pages}
        </span>
        <button type="button" className="btn btn--ghost btn--sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next →
        </button>
      </div>
    </nav>
  );
}
