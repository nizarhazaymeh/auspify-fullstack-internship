import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productApi } from '../../api/client.js';
import { useMeta } from '../../hooks/useMeta.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useToast } from '../../components/Toast.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import Pagination from '../../components/Pagination.jsx';
import Icon from '../../components/Icon.jsx';
import { EmptyState, ErrorBanner, Spinner } from '../../components/States.jsx';
import ProductFormModal from './ProductFormModal.jsx';
import { formatMoney } from '../../utils/format.js';

export default function AdminProducts() {
  const { categories } = useMeta();
  const notify = useToast();
  const [params] = useSearchParams();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState(params.get('sort') ?? 'newest');
  const [page, setPage] = useState(1);
  const q = useDebounce(search.trim());
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState(null); // null closed, {} new, product = edit
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const refresh = useCallback(() => setReload((n) => n + 1), []);
  const closeForm = useCallback(() => setEditing(null), []);

  useEffect(() => {
    setPage(1);
  }, [q, category, sort]);

  useEffect(() => {
    const ctrl = new AbortController();
    setError(null);
    productApi
      .list({ all: true, search: q, category, sort, page, limit: 15 }, ctrl.signal)
      .then(setResult)
      .catch((err) => err.name !== 'AbortError' && setError(err));
    return () => ctrl.abort();
  }, [q, category, sort, page, reload]);

  const save = async (values) => {
    if (editing?.id) {
      await productApi.update(editing.id, values);
      notify('Product updated.');
    } else {
      await productApi.create(values);
      notify('Product created.');
    }
    setEditing(null);
    refresh();
  };

  const toggleActive = async (p) => {
    try {
      await productApi.update(p.id, { active: !p.active });
      notify(p.active ? `${p.name} is now hidden.` : `${p.name} is now visible.`);
      refresh();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await productApi.remove(toDelete.id);
      notify('Product deleted.');
      setToDelete(null);
      refresh();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="card">
        <div className="toolbar">
          <div className="search">
            <Icon name="search" />
            <input type="search" placeholder="Search products…" aria-label="Search products" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="name">Name</option>
            <option value="stock">Lowest stock</option>
            <option value="price-desc">Price high → low</option>
            <option value="price-asc">Price low → high</option>
          </select>
          <button type="button" className="btn btn--primary" onClick={() => setEditing({})}>
            <Icon name="plus" size={16} /> New product
          </button>
        </div>

        {error && <ErrorBanner error={error} onRetry={refresh} />}
        {!result && !error && <Spinner label="Loading products…" />}
        {result && result.data.length === 0 && <EmptyState title="No products found" />}
        {result && result.data.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="num">Price</th>
                  <th className="num">Stock</th>
                  <th>Status</th>
                  <th className="num">Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((p) => (
                  <tr key={p.id} className={p.active ? '' : 'is-muted'}>
                    <td data-label="Product">
                      <span className="cell-product">
                        <span className="cell-product__emoji" aria-hidden="true">
                          {p.emoji || '🛍️'}
                        </span>
                        <span>
                          <strong>{p.name}</strong>
                          <span className="muted">{p.brand}</span>
                        </span>
                      </span>
                    </td>
                    <td data-label="Category">{p.category}</td>
                    <td data-label="Price" className="num">
                      {formatMoney(p.price)}
                      {p.compareAtPrice && <s className="muted"> {formatMoney(p.compareAtPrice)}</s>}
                    </td>
                    <td data-label="Stock" className="num">
                      <span className={`stock-pill ${p.stock === 0 ? 'stock-pill--out' : p.stock <= 5 ? 'stock-pill--low' : ''}`}>{p.stock}</span>
                    </td>
                    <td data-label="Status">
                      <button type="button" className={`toggle ${p.active ? 'is-on' : ''}`} onClick={() => toggleActive(p)} aria-pressed={p.active}>
                        {p.active ? 'Visible' : 'Hidden'}
                      </button>
                      {p.featured && <span className="tag">Featured</span>}
                    </td>
                    <td className="num cell-actions">
                      <button type="button" className="icon-btn" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}>
                        <Icon name="edit" size={16} />
                      </button>
                      <button type="button" className="icon-btn icon-btn--danger" onClick={() => setToDelete(p)} aria-label={`Delete ${p.name}`}>
                        <Icon name="trash" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {result?.pagination.pages > 1 && <Pagination {...result.pagination} onChange={setPage} />}
      </div>

      <ProductFormModal open={editing !== null} product={editing?.id ? editing : null} onClose={closeForm} onSave={save} />
      <ConfirmModal
        open={Boolean(toDelete)}
        title="Delete product?"
        message={toDelete && `“${toDelete.name}” will be removed from the store and from customers' carts. Past orders keep their records. Tip: hide it instead if you might sell it again.`}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
