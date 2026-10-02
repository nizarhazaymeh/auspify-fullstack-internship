import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import ProductImage from '../components/ProductImage.jsx';
import QtyStepper from '../components/QtyStepper.jsx';
import Icon from '../components/Icon.jsx';
import { EmptyState, Spinner } from '../components/States.jsx';
import { formatMoney } from '../utils/format.js';

export function OrderSummary({ cart, children }) {
  const remaining = Math.max(0, (cart.freeShippingOver ?? 50) - cart.subtotal);
  return (
    <aside className="card summary-card">
      <h2>Order summary</h2>
      <dl>
        <div>
          <dt>Subtotal ({cart.count} items)</dt>
          <dd>{formatMoney(cart.subtotal)}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>{cart.shipping === 0 ? 'Free' : formatMoney(cart.shipping)}</dd>
        </div>
        <div className="summary-card__total">
          <dt>Total</dt>
          <dd>{formatMoney(cart.total)}</dd>
        </div>
      </dl>
      {cart.subtotal > 0 && (
        <div className="ship-progress">
          <p>{remaining > 0 ? <>Add <strong>{formatMoney(remaining)}</strong> more for free shipping</> : <><Icon name="check" size={14} /> You&apos;ve got free shipping!</>}</p>
          <div className="bar">
            <span style={{ width: `${Math.min(100, (cart.subtotal / (cart.freeShippingOver ?? 50)) * 100)}%` }} />
          </div>
        </div>
      )}
      {children}
    </aside>
  );
}

export default function Cart() {
  const cart = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const notify = useToast();
  const [busyId, setBusyId] = useState(null);

  const run = async (id, fn) => {
    setBusyId(id);
    try {
      await fn();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (cart.loading && cart.items.length === 0) return <Spinner label="Loading your cart…" />;

  if (cart.items.length === 0) {
    return (
      <div className="container section">
        <EmptyState title="Your cart is empty">
          {cart.warnings?.map((w) => (
            <p key={w} className="muted">
              {w}
            </p>
          ))}
          <p className="muted">Browse the shop and add something you like.</p>
          <Link to="/shop" className="btn btn--primary">
            Start shopping
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1>Shopping cart</h1>
      {cart.warnings?.length > 0 && (
        <div className="banner banner--warn" role="status">
          {cart.warnings.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
      )}
      <div className="cart">
        <ul className="card cart__items">
          {cart.items.map((i) => (
            <li key={i.productId} className={`cart-item ${busyId === i.productId ? 'is-loading' : ''}`}>
              <Link to={`/product/${i.slug}`} className="cart-item__img" tabIndex={-1} aria-hidden="true">
                <ProductImage product={i} size="sm" />
              </Link>
              <div className="cart-item__info">
                <Link to={`/product/${i.slug}`} className="cart-item__name">
                  {i.name}
                </Link>
                <span className="muted">{formatMoney(i.price)} each</span>
                {i.stock <= 5 && <span className="pcard__low">Only {i.stock} left</span>}
              </div>
              <QtyStepper
                value={i.qty}
                max={Math.min(i.stock, cart.maxQtyPerItem)}
                onChange={(q) => run(i.productId, () => cart.setQty(i.productId, q))}
                disabled={busyId === i.productId}
                label={`Quantity of ${i.name}`}
              />
              <strong className="cart-item__total">{formatMoney(i.lineTotal)}</strong>
              <button type="button" className="icon-btn icon-btn--danger" aria-label={`Remove ${i.name}`} onClick={() => run(i.productId, () => cart.remove(i.productId))}>
                <Icon name="trash" size={16} />
              </button>
            </li>
          ))}
        </ul>
        <OrderSummary cart={cart}>
          <button type="button" className="btn btn--primary btn--lg btn--block" onClick={() => navigate(user ? '/checkout' : '/login?redirect=/checkout')}>
            {user ? 'Proceed to checkout' : 'Log in to check out'}
          </button>
          <Link to="/shop" className="summary-card__continue">
            ← Continue shopping
          </Link>
        </OrderSummary>
      </div>
    </div>
  );
}
