import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { productApi } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../components/Toast.jsx';
import ProductImage from '../components/ProductImage.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Price from '../components/Price.jsx';
import QtyStepper from '../components/QtyStepper.jsx';
import Icon from '../components/Icon.jsx';
import { EmptyState, ErrorBanner, Spinner } from '../components/States.jsx';
import { useMeta } from '../hooks/useMeta.js';

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { add, items } = useCart();
  const { maxQtyPerItem, shipping } = useMeta();
  const notify = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    setData(null);
    setError(null);
    setQty(1);
    productApi
      .get(slug, ctrl.signal)
      .then((d) => {
        setData(d);
        document.title = `${d.product.name} · Storefront`;
      })
      .catch((err) => err.name !== 'AbortError' && setError(err));
    return () => {
      ctrl.abort();
      document.title = 'Storefront';
    };
  }, [slug]);

  if (error?.status === 404) {
    return (
      <div className="container section">
        <EmptyState title="Product not found">
          <Link to="/shop" className="btn btn--primary">
            Back to shop
          </Link>
        </EmptyState>
      </div>
    );
  }
  if (error) return <div className="container section"><ErrorBanner error={error} /></div>;
  if (!data) return <Spinner label="Loading product…" />;

  const { product: p, related } = data;
  const inCart = items.find((i) => i.productId === p.id)?.qty ?? 0;
  const maxAddable = Math.max(0, Math.min(p.stock, maxQtyPerItem) - inCart);
  const soldOut = p.stock === 0;

  const addToCart = async (goToCart) => {
    setBusy(true);
    try {
      await add(p, qty);
      if (goToCart) navigate('/cart');
      else notify(`Added ${qty} × ${p.name} to your cart.`);
      setQty(1);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container section">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link> / <Link to={`/shop?category=${encodeURIComponent(p.category)}`}>{p.category}</Link> / <span>{p.name}</span>
      </nav>

      <div className="pdp">
        <ProductImage product={p} size="lg" />
        <div className="pdp__info">
          <span className="pdp__brand">{p.brand}</span>
          <h1>{p.name}</h1>
          <Price price={p.price} compareAt={p.compareAtPrice} large />
          <p className={`stock ${soldOut ? 'stock--out' : p.stock <= 5 ? 'stock--low' : 'stock--in'}`}>
            {soldOut ? 'Out of stock' : p.stock <= 5 ? `Only ${p.stock} left in stock` : 'In stock'}
          </p>
          <p className="pdp__desc">{p.description}</p>

          {!soldOut && (
            <div className="pdp__buy">
              <QtyStepper value={qty} max={Math.max(1, maxAddable)} onChange={setQty} disabled={maxAddable === 0} />
              <button type="button" className="btn btn--primary btn--lg" onClick={() => addToCart(false)} disabled={busy || maxAddable === 0}>
                <Icon name="cart" /> Add to cart
              </button>
              <button type="button" className="btn btn--ghost btn--lg" onClick={() => addToCart(true)} disabled={busy || maxAddable === 0}>
                Buy now
              </button>
            </div>
          )}
          {inCart > 0 && (
            <p className="muted">
              {inCart} in your cart · <Link to="/cart">View cart</Link>
              {maxAddable === 0 && ' · maximum reached'}
            </p>
          )}

          <ul className="pdp__perks">
            <li>
              <Icon name="truck" size={16} /> Free shipping on orders over ${shipping.freeOver}
            </li>
            <li>
              <Icon name="shield" size={16} /> Pay cash on delivery
            </li>
            <li>
              <Icon name="refresh" size={16} /> Cancel free of charge before dispatch
            </li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <h2 className="section__title">You may also like</h2>
          <div className="grid">
            {related.map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
