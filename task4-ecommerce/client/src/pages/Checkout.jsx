import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import AddressFields, { emptyAddress, trimAddress, validateAddress } from '../components/AddressFields.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { OrderSummary } from './Cart.jsx';
import { EmptyState, Spinner } from '../components/States.jsx';
import { formatMoney } from '../utils/format.js';

export default function Checkout() {
  const { user, setUser } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState({ ...emptyAddress, fullName: user.name, ...(user.address ?? {}) });
  const [note, setNote] = useState('');
  const [saveAddress, setSaveAddress] = useState(!user.address);
  const [errors, setErrors] = useState({});
  const [problems, setProblems] = useState([]);
  const [formError, setFormError] = useState('');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    cart.refresh(); // re-check stock and prices before paying
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (cart.loading && !cart.items.length) return <Spinner label="Loading checkout…" />;
  if (!cart.items.length) {
    return (
      <div className="container section">
        <EmptyState title="Your cart is empty">
          <Link to="/shop" className="btn btn--primary">
            Go to shop
          </Link>
        </EmptyState>
      </div>
    );
  }

  const place = async (e) => {
    e.preventDefault();
    const found = validateAddress(address);
    setErrors(found);
    setProblems([]);
    setFormError('');
    if (Object.keys(found).length) {
      document.getElementById(`ship-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    setPlacing(true);
    try {
      const shippingAddress = trimAddress(address);
      const order = await orderApi.checkout({ shippingAddress, note: note.trim(), saveAddress });
      if (saveAddress) setUser({ ...user, address: shippingAddress });
      cart.setServerCart({ items: [], count: 0, subtotal: 0, shipping: 0, total: 0, warnings: [] });
      navigate(`/orders/${order.id}?placed=1`, { replace: true });
    } catch (err) {
      if (err.errors) {
        setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k.replace('shippingAddress.', ''), v])));
      }
      setProblems(err.problems ?? []);
      setFormError(err.message);
      if (err.status === 409) cart.refresh();
      setPlacing(false);
    }
  };

  return (
    <div className="container section">
      <h1>Checkout</h1>
      <form className="cart" onSubmit={place} noValidate>
        <div className="checkout__main">
          {(formError || cart.warnings?.length > 0) && (
            <div className="banner banner--error" role="alert">
              <strong>{formError || 'Your cart was updated'}</strong>
              {[...problems, ...(cart.warnings ?? [])].map((p) => (
                <div key={p}>{p}</div>
              ))}
            </div>
          )}
          <section className="card panel">
            <h2>Shipping address</h2>
            <AddressFields value={address} onChange={setAddress} errors={errors} idPrefix="ship" />
            <label className="check">
              <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
              Save this address to my account
            </label>
            <div className="field">
              <label htmlFor="note">Delivery note (optional)</label>
              <textarea id="note" rows="2" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Call when you arrive" />
            </div>
          </section>

          <section className="card panel">
            <h2>Payment</h2>
            <label className="pay-option is-selected">
              <input type="radio" name="payment" checked readOnly />
              <span>
                <strong>Cash on delivery</strong>
                <span className="muted">Pay in cash when your order arrives. No card details needed.</span>
              </span>
            </label>
          </section>

          <section className="card panel">
            <h2>Items ({cart.count})</h2>
            <ul className="mini-items">
              {cart.items.map((i) => (
                <li key={i.productId}>
                  <ProductImage product={i} size="xs" />
                  <span className="mini-items__name">
                    {i.name} <span className="muted">× {i.qty}</span>
                  </span>
                  <strong>{formatMoney(i.lineTotal)}</strong>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <OrderSummary cart={cart}>
          <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={placing || cart.loading}>
            {placing ? 'Placing order…' : `Place order · ${formatMoney(cart.total)}`}
          </button>
          <Link to="/cart" className="summary-card__continue">
            ← Back to cart
          </Link>
        </OrderSummary>
      </form>
    </div>
  );
}
