import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi, orderApi } from '../../api/client.js';
import { useMeta } from '../../hooks/useMeta.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useToast } from '../../components/Toast.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Pagination from '../../components/Pagination.jsx';
import Icon from '../../components/Icon.jsx';
import { EmptyState, ErrorBanner, Spinner } from '../../components/States.jsx';
import { OrderBody } from '../OrderDetail.jsx';
import { formatDate, formatMoney, STATUS_LABELS } from '../../utils/format.js';

function StatusSelect({ order, onChange }) {
  const { statusFlow } = useMeta();
  const next = statusFlow[order.status] ?? [];
  if (!next.length) return <StatusBadge status={order.status} />;
  return (
    <select className={`status-select status--${order.status}`} value={order.status} onChange={(e) => onChange(order, e.target.value)} aria-label={`Status of ${order.orderNumber}`} onClick={(e) => e.stopPropagation()}>
      <option value={order.status}>{STATUS_LABELS[order.status]}</option>
      {next.map((s) => (
        <option key={s} value={s}>
          → {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}

function OrderModal({ id, onClose, onStatus }) {
  const [order, setOrder] = useState(null);
  useEffect(() => {
    const ctrl = new AbortController();
    orderApi.get(id, ctrl.signal).then(setOrder).catch(() => {});
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      ctrl.abort();
      window.removeEventListener('keydown', onKey);
    };
  }, [id, onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--wide" role="dialog" aria-modal="true" aria-label="Order details">
        {!order ? (
          <Spinner label="Loading order…" />
        ) : (
          <>
            <div className="page-head">
              <div>
                <h2>{order.orderNumber}</h2>
                <p className="muted">
                  {order.user?.name} · {order.user?.email} · {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="page-head__actions">
                <StatusSelect order={order} onChange={async (o, s) => setOrder((await onStatus(o, s)) ?? o)} />
                <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
                  <Icon name="x" size={16} />
                </button>
              </div>
            </div>
            <OrderBody order={order} />
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const { orderStatuses } = useMeta();
  const notify = useToast();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounce(search.trim());
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);
  const [openId, setOpenId] = useState(null);
  const refresh = useCallback(() => setReload((n) => n + 1), []);
  const close = useCallback(() => setOpenId(null), []);

  useEffect(() => {
    setPage(1);
  }, [q, status]);

  useEffect(() => {
    const ctrl = new AbortController();
    setError(null);
    adminApi
      .orders({ status, search: q, page, limit: 15 }, ctrl.signal)
      .then(setResult)
      .catch((err) => err.name !== 'AbortError' && setError(err));
    return () => ctrl.abort();
  }, [status, q, page, reload]);

  const changeStatus = async (order, next) => {
    try {
      const updated = await adminApi.setStatus(order.id, next);
      notify(`${order.orderNumber} marked ${STATUS_LABELS[next].toLowerCase()}.`);
      refresh();
      return updated;
    } catch (err) {
      notify(err.message, 'error');
      refresh();
      return null;
    }
  };

  return (
    <>
      <div className="card">
        <div className="toolbar">
          <div className="search">
            <Icon name="search" />
            <input type="search" placeholder="Order #, customer name or email…" aria-label="Search orders" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="chips" role="group" aria-label="Filter by status">
            {['', ...orderStatuses].map((s) => (
              <button key={s || 'all'} type="button" className={`chip ${status === s ? 'is-active' : ''}`} onClick={() => setParams(s ? { status: s } : {})}>
                {s ? STATUS_LABELS[s] : 'All'}
              </button>
            ))}
          </div>
        </div>

        {error && <ErrorBanner error={error} onRetry={refresh} />}
        {!result && !error && <Spinner label="Loading orders…" />}
        {result && result.data.length === 0 && <EmptyState title="No orders found" />}
        {result && result.data.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th className="num">Items</th>
                  <th className="num">Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((o) => (
                  <tr key={o.id} className="table__row" onClick={() => setOpenId(o.id)}>
                    <td data-label="Order">
                      <button type="button" className="link-btn" onClick={() => setOpenId(o.id)}>
                        {o.orderNumber}
                      </button>
                    </td>
                    <td data-label="Customer">
                      <span className="cell-stack">
                        <span>{o.user?.name ?? o.shippingAddress.fullName}</span>
                        <span className="muted">{o.user?.email}</span>
                      </span>
                    </td>
                    <td data-label="Date">{formatDate(o.createdAt)}</td>
                    <td data-label="Items" className="num">
                      {o.items.reduce((n, i) => n + i.qty, 0)}
                    </td>
                    <td data-label="Total" className="num">
                      <strong>{formatMoney(o.total)}</strong>
                    </td>
                    <td data-label="Status" onClick={(e) => e.stopPropagation()}>
                      <StatusSelect order={o} onChange={changeStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {result?.pagination.pages > 1 && <Pagination {...result.pagination} onChange={setPage} />}
      </div>
      {openId && <OrderModal id={openId} onClose={close} onStatus={changeStatus} />}
    </>
  );
}
