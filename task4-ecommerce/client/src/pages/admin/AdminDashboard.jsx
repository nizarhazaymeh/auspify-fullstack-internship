import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/client.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import { ErrorBanner, Spinner } from '../../components/States.jsx';
import { formatDate, formatMoney, STATUS_LABELS } from '../../utils/format.js';

function RevenueChart({ days }) {
  const max = Math.max(1, ...days.map((d) => d.revenue));
  return (
    <div className="spark" role="img" aria-label="Revenue per day for the last 30 days">
      {days.map((d) => (
        <div key={d.date} className="spark__col" title={`${formatDate(d.date, { day: 'numeric', month: 'short' })}: ${formatMoney(d.revenue)} · ${d.orders} orders`}>
          <span style={{ height: `${Math.max(d.revenue ? 4 : 0, (d.revenue / max) * 100)}%` }} />
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [s, setS] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    adminApi
      .stats(ctrl.signal)
      .then(setS)
      .catch((err) => err.name !== 'AbortError' && setError(err));
    return () => ctrl.abort();
  }, []);

  if (error) return <ErrorBanner error={error} />;
  if (!s) return <Spinner label="Loading dashboard…" />;

  const last30 = s.daily.reduce((n, d) => n + d.revenue, 0);
  const cards = [
    { label: 'Total revenue', value: formatMoney(s.revenue), sub: `${formatMoney(last30)} in the last 30 days` },
    { label: 'Orders', value: s.orders, sub: `Avg. ${formatMoney(s.averageOrder)} per order` },
    { label: 'Products', value: s.productCount, sub: `${s.lowStock.length} low on stock` },
    { label: 'Customers', value: s.customers, sub: 'Registered accounts' },
  ];

  return (
    <div className="stack">
      <ul className="kpis">
        {cards.map((c) => (
          <li key={c.label} className="card kpi">
            <span className="kpi__label">{c.label}</span>
            <strong className="kpi__value">{c.value}</strong>
            <span className="kpi__sub">{c.sub}</span>
          </li>
        ))}
      </ul>

      <div className="admin-grid">
        <section className="card panel admin-grid__wide">
          <div className="panel__head">
            <h2>Revenue · last 30 days</h2>
            <span className="muted">{formatMoney(last30)}</span>
          </div>
          <RevenueChart days={s.daily} />
        </section>

        <section className="card panel">
          <div className="panel__head">
            <h2>Orders by status</h2>
            <Link to="/admin/orders">Manage</Link>
          </div>
          <ul className="status-list">
            {Object.entries(s.byStatus).map(([status, count]) => (
              <li key={status}>
                <Link to={`/admin/orders?status=${status}`}>
                  <StatusBadge status={status} />
                  <strong>{count}</strong>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card panel">
          <div className="panel__head">
            <h2>Low stock</h2>
            <Link to="/admin/products?sort=stock">View all</Link>
          </div>
          {s.lowStock.length === 0 ? (
            <p className="muted">All products are well stocked.</p>
          ) : (
            <ul className="rank">
              {s.lowStock.map((p) => (
                <li key={p.id}>
                  <span aria-hidden="true">{p.emoji || '🛍️'}</span>
                  <span className="rank__name">{p.name}</span>
                  <span className={`stock-pill ${p.stock === 0 ? 'stock-pill--out' : ''}`}>{p.stock === 0 ? 'Sold out' : `${p.stock} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card panel">
          <div className="panel__head">
            <h2>Best sellers</h2>
          </div>
          {s.topProducts.length === 0 ? (
            <p className="muted">No sales yet.</p>
          ) : (
            <ul className="rank">
              {s.topProducts.map((p, i) => (
                <li key={p.id}>
                  <span className="rank__n">{i + 1}</span>
                  <span className="rank__name">
                    {p.emoji} {p.name}
                  </span>
                  <span className="muted">
                    {p.units} sold · {formatMoney(p.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card panel">
          <div className="panel__head">
            <h2>Recent orders</h2>
            <Link to="/admin/orders">View all</Link>
          </div>
          <ul className="rank">
            {s.recentOrders.map((o) => (
              <li key={o.id}>
                <span className="rank__name">
                  <strong>{o.orderNumber}</strong>
                  <span className="muted"> · {o.user?.name ?? 'Deleted user'}</span>
                </span>
                <span title={STATUS_LABELS[o.status]}>
                  <StatusBadge status={o.status} />
                </span>
                <strong>{formatMoney(o.total)}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
