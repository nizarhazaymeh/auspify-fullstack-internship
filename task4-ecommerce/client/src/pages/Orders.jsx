import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';
import Pagination from '../components/Pagination.jsx';
import { EmptyState, ErrorBanner, Spinner } from '../components/States.jsx';
import { formatDate, formatMoney } from '../utils/format.js';

export default function Orders() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    orderApi
      .mine({ page, limit: 10 }, ctrl.signal)
      .then(setResult)
      .catch((err) => err.name !== 'AbortError' && setError(err));
    return () => ctrl.abort();
  }, [page]);

  return (
    <div className="container section narrow">
      <h1>My orders</h1>
      {error && <ErrorBanner error={error} />}
      {!result && !error && <Spinner label="Loading orders…" />}
      {result && result.data.length === 0 && (
        <EmptyState title="No orders yet">
          <Link to="/shop" className="btn btn--primary">
            Start shopping
          </Link>
        </EmptyState>
      )}
      {result && result.data.length > 0 && (
        <>
          <ul className="order-list">
            {result.data.map((o) => (
              <li key={o.id}>
                <Link to={`/orders/${o.id}`} className="card order-row">
                  <div className="order-row__thumbs" aria-hidden="true">
                    {o.items.slice(0, 3).map((i) => (
                      <span key={i.product}>{i.emoji || '🛍️'}</span>
                    ))}
                  </div>
                  <div className="order-row__info">
                    <strong>{o.orderNumber}</strong>
                    <span className="muted">
                      {formatDate(o.createdAt)} · {o.items.reduce((n, i) => n + i.qty, 0)} items
                    </span>
                  </div>
                  <StatusBadge status={o.status} />
                  <strong className="order-row__total">{formatMoney(o.total)}</strong>
                </Link>
              </li>
            ))}
          </ul>
          {result.pagination.pages > 1 && <Pagination {...result.pagination} onChange={setPage} />}
        </>
      )}
    </div>
  );
}
