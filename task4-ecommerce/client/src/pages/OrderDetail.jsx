import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { orderApi } from '../api/client.js';
import { useToast } from '../components/Toast.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import OrderTimeline from '../components/OrderTimeline.jsx';
import Icon from '../components/Icon.jsx';
import { EmptyState, ErrorBanner, Spinner } from '../components/States.jsx';
import { formatDateTime, formatMoney } from '../utils/format.js';

export function OrderBody({ order }) {
  const a = order.shippingAddress;
  return (
    <>
      <OrderTimeline order={order} />
      <div className="order-grid">
        <section className="card panel">
          <h2>Items</h2>
          <ul className="mini-items">
            {order.items.map((i) => (
              <li key={i.product}>
                <span className="mini-items__emoji" aria-hidden="true">
                  {i.emoji || '🛍️'}
                </span>
                <span className="mini-items__name">
                  {i.name}
                  <span className="muted">
                    {' '}
                    × {i.qty} · {formatMoney(i.price)}
                  </span>
                </span>
                <strong>{formatMoney(i.lineTotal)}</strong>
              </li>
            ))}
          </ul>
          <dl className="totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney(order.subtotal)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>{order.shipping === 0 ? 'Free' : formatMoney(order.shipping)}</dd>
            </div>
            <div className="totals__grand">
              <dt>Total</dt>
              <dd>{formatMoney(order.total)}</dd>
            </div>
          </dl>
        </section>
        <section className="card panel">
          <h2>Delivery</h2>
          <address className="addr">
            <strong>{a.fullName}</strong>
            <span>{a.street}</span>
            <span>
              {a.city}
              {a.postalCode ? `, ${a.postalCode}` : ''}
            </span>
            <span>{a.country}</span>
            <span>{a.phone}</span>
          </address>
          {order.note && (
            <p className="muted">
              <strong>Note:</strong> {order.note}
            </p>
          )}
          <h2 className="mt">Payment</h2>
          <p>{order.paymentMethod}</p>
        </section>
      </div>
    </>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const notify = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const placed = params.get('placed') === '1';

  useEffect(() => {
    const ctrl = new AbortController();
    orderApi
      .get(id, ctrl.signal)
      .then(setOrder)
      .catch((err) => err.name !== 'AbortError' && setError(err));
    return () => ctrl.abort();
  }, [id]);

  const cancel = async () => {
    setCancelling(true);
    try {
      setOrder(await orderApi.cancel(id));
      notify('Your order was cancelled.');
      setConfirming(false);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (error?.status === 404 || error?.status === 400) {
    return (
      <div className="container section">
        <EmptyState title="Order not found">
          <Link to="/orders" className="btn btn--primary">
            My orders
          </Link>
        </EmptyState>
      </div>
    );
  }
  if (error) return <div className="container section"><ErrorBanner error={error} /></div>;
  if (!order) return <Spinner label="Loading order…" />;

  return (
    <div className="container section narrow">
      <Link to="/orders" className="back-link">
        <Icon name="arrowLeft" size={16} /> My orders
      </Link>
      {placed && order.status === 'pending' && (
        <div className="success-box" role="status">
          <span className="success-box__icon">
            <Icon name="check" size={22} />
          </span>
          <div>
            <h2>Thank you! Your order has been placed.</h2>
            <p>
              Order <strong>{order.orderNumber}</strong> · Pay {formatMoney(order.total)} in cash when it arrives.
            </p>
          </div>
        </div>
      )}
      <div className="page-head">
        <div>
          <h1>Order {order.orderNumber}</h1>
          <p className="muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="page-head__actions">
          <StatusBadge status={order.status} />
          {order.status === 'pending' && (
            <button type="button" className="btn btn--danger-ghost" onClick={() => setConfirming(true)}>
              Cancel order
            </button>
          )}
        </div>
      </div>
      <OrderBody order={order} />
      <ConfirmModal
        open={confirming}
        title="Cancel this order?"
        message="The order will be cancelled and won't be delivered. This can't be undone."
        confirmLabel="Cancel order"
        busy={cancelling}
        onConfirm={cancel}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
