import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';
import Icon from '../components/Icon.jsx';
import { ErrorBanner, Spinner } from '../components/States.jsx';
import { CATEGORY_EMOJI, categoryHue } from '../utils/format.js';
import { useMeta } from '../hooks/useMeta.js';

export default function Home() {
  const { shipping } = useMeta();
  const [featured, setFeatured] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    productApi
      .list({ featured: true, limit: 8 }, ctrl.signal)
      .then((r) => {
        setFeatured(r.data);
        setCategories(r.categories);
      })
      .catch((err) => err.name !== 'AbortError' && setError(err));
    return () => ctrl.abort();
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <div>
            <p className="eyebrow">New season · Up to 25% off</p>
            <h1>Everyday essentials, delivered to your door.</h1>
            <p className="hero__lead">Electronics, fashion, home and more — all in one place, with free shipping on orders over ${shipping.freeOver}.</p>
            <div className="hero__cta">
              <Link to="/shop" className="btn btn--primary btn--lg">
                Shop now
              </Link>
              <Link to="/shop?sort=price-asc" className="btn btn--ghost btn--lg">
                Browse deals
              </Link>
            </div>
          </div>
          <div className="hero__art" aria-hidden="true">
            {['🎧', '👟', '☕', '⌚', '📗', '🪴'].map((e, i) => (
              <span key={e} style={{ '--i': i }}>
                {e}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="container perks">
        <div>
          <Icon name="truck" size={22} />
          <span>
            <strong>Free shipping</strong> over ${shipping.freeOver}
          </span>
        </div>
        <div>
          <Icon name="refresh" size={22} />
          <span>
            <strong>Easy cancellation</strong> before dispatch
          </span>
        </div>
        <div>
          <Icon name="shield" size={22} />
          <span>
            <strong>Pay on delivery</strong> — no card needed
          </span>
        </div>
      </section>

      <section className="container section">
        <h2 className="section__title">Shop by category</h2>
        <div className="cats">
          {categories.map((c) => (
            <Link key={c.name} to={`/shop?category=${encodeURIComponent(c.name)}`} className="cat" style={{ '--hue': categoryHue(c.name) }}>
              <span className="cat__emoji" aria-hidden="true">
                {CATEGORY_EMOJI[c.name]}
              </span>
              <span className="cat__name">{c.name}</span>
              <span className="cat__count">{c.count} items</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section__head">
          <h2 className="section__title">Featured products</h2>
          <Link to="/shop">View all →</Link>
        </div>
        {error && <ErrorBanner error={error} />}
        {!featured && !error && <Spinner label="Loading products…" />}
        {featured && (
          <div className="grid">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
