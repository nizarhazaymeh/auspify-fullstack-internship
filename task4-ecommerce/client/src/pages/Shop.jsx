import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productApi } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';
import Pagination from '../components/Pagination.jsx';
import Icon from '../components/Icon.jsx';
import { EmptyState, ErrorBanner, Spinner } from '../components/States.jsx';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name A–Z' },
];
const LIMIT = 12;

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const get = (k) => params.get(k) ?? '';
  const search = get('search');
  const category = get('category');
  const sort = get('sort') || 'newest';
  const page = Number(get('page')) || 1;
  const [minPrice, setMinPrice] = useState(get('minPrice'));
  const [maxPrice, setMaxPrice] = useState(get('maxPrice'));

  const update = (changes) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v === '' || v == null || v === false) next.delete(k);
      else next.set(k, v);
    }
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  useEffect(() => {
    setMinPrice(get('minPrice'));
    setMaxPrice(get('maxPrice'));
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    productApi
      .list(
        { search, category, sort, page, limit: LIMIT, minPrice: get('minPrice'), maxPrice: get('maxPrice'), inStock: get('inStock') === 'true' },
        ctrl.signal
      )
      .then((r) => {
        setResult(r);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err);
        setLoading(false);
      });
    return () => ctrl.abort();
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyPrice = (e) => {
    e.preventDefault();
    update({ minPrice, maxPrice });
  };

  const active = Boolean(search || category || get('minPrice') || get('maxPrice') || get('inStock'));
  const total = result?.categories.reduce((n, c) => n + c.count, 0) ?? 0;

  return (
    <div className="container section">
      <div className="shop-head">
        <div>
          <h1>{category || (search ? `Results for “${search}”` : 'All products')}</h1>
          {result && <p className="muted">{result.pagination.total} products</p>}
        </div>
        <div className="shop-head__controls">
          <button type="button" className="btn btn--ghost filters-toggle" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
            <Icon name="filter" size={16} /> Filters
          </button>
          <select aria-label="Sort products" value={sort} onChange={(e) => update({ sort: e.target.value === 'newest' ? '' : e.target.value })}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="shop">
        <aside className={`filters ${showFilters ? 'is-open' : ''}`} aria-label="Filters">
          <div className="filters__group">
            <h3>Category</h3>
            <button type="button" className={`filters__cat ${!category ? 'is-active' : ''}`} onClick={() => update({ category: '' })}>
              All <span>{total}</span>
            </button>
            {result?.categories.map((c) => (
              <button
                key={c.name}
                type="button"
                className={`filters__cat ${category === c.name ? 'is-active' : ''}`}
                onClick={() => update({ category: c.name })}
                disabled={c.count === 0 && category !== c.name}
              >
                {c.name} <span>{c.count}</span>
              </button>
            ))}
          </div>
          <form className="filters__group" onSubmit={applyPrice}>
            <h3>Price</h3>
            <div className="price-range">
              <input type="number" min="0" step="1" placeholder="Min" aria-label="Minimum price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
              <span>–</span>
              <input type="number" min="0" step="1" placeholder="Max" aria-label="Maximum price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </div>
            <button type="submit" className="btn btn--ghost btn--sm btn--block">
              Apply
            </button>
          </form>
          <div className="filters__group">
            <label className="check">
              <input type="checkbox" checked={get('inStock') === 'true'} onChange={(e) => update({ inStock: e.target.checked ? 'true' : '' })} />
              In stock only
            </label>
          </div>
          {active && (
            <button type="button" className="btn btn--ghost btn--sm btn--block" onClick={() => setParams(sort !== 'newest' ? { sort } : {})}>
              Clear all filters
            </button>
          )}
        </aside>

        <section className="shop__results">
          {error && <ErrorBanner error={error} />}
          {loading && !result && <Spinner label="Loading products…" />}
          {result && !error && result.data.length === 0 && (
            <EmptyState title="No products found">
              <p className="muted">Try a different search or remove some filters.</p>
            </EmptyState>
          )}
          {result && !error && result.data.length > 0 && (
            <div className={loading ? 'is-loading' : ''}>
              <div className="grid grid--shop">
                {result.data.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {result.pagination.pages > 1 && <Pagination {...result.pagination} onChange={(p) => update({ page: p > 1 ? p : '' })} />}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
