import { useEffect, useState } from 'react';
import { useMeta } from '../../hooks/useMeta.js';
import ProductImage from '../../components/ProductImage.jsx';

const MONEY_RE = /^\d+(\.\d{1,2})?$/;
const blank = { name: '', brand: '', category: '', price: '', compareAtPrice: '', stock: '0', emoji: '', image: '', description: '', featured: false, active: true };

const toValues = (p) =>
  p
    ? {
        ...blank,
        ...Object.fromEntries(Object.keys(blank).map((k) => [k, p[k] ?? blank[k]])),
        price: String(p.price),
        compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : '',
        stock: String(p.stock),
      }
    : blank;

function validate(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = 'Name must be at least 2 characters.';
  if (!v.category) e.category = 'Choose a category.';
  if (!MONEY_RE.test(v.price) || Number(v.price) <= 0) e.price = 'Enter a price like 19.99.';
  if (v.compareAtPrice && (!MONEY_RE.test(v.compareAtPrice) || Number(v.compareAtPrice) <= Number(v.price)))
    e.compareAtPrice = 'Must be higher than the price (or leave empty).';
  if (!/^\d+$/.test(v.stock)) e.stock = 'Stock must be a whole number.';
  if (v.image && !/^https?:\/\/\S+$/.test(v.image)) e.image = 'Use a full http(s) image URL.';
  return e;
}

export default function ProductFormModal({ open, product, onClose, onSave }) {
  const { categories } = useMeta();
  const [values, setValues] = useState(blank);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    setValues(toValues(product));
    setErrors({});
    setFormError('');
    setSaving(false);
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, product, onClose]);

  if (!open) return null;

  const set = (name, value) => setValues((v) => ({ ...v, [name]: value }));
  const submit = async (e) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setFormError('');
    try {
      await onSave({
        ...values,
        name: values.name.trim(),
        brand: values.brand.trim(),
        description: values.description.trim(),
        image: values.image.trim(),
        stock: Number(values.stock),
        compareAtPrice: values.compareAtPrice || null,
      });
    } catch (err) {
      setErrors(err.errors ?? {});
      setFormError(err.message);
      setSaving(false);
    }
  };

  const f = (name) => ({ id: `pf-${name}`, value: values[name], onChange: (e) => set(name, e.target.value), 'aria-invalid': Boolean(errors[name]) });
  const err = (name) => errors[name] && <p className="field__error">{errors[name]}</p>;

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <form className="modal modal--wide" role="dialog" aria-modal="true" aria-labelledby="pf-title" onSubmit={submit} noValidate>
        <h2 id="pf-title">{product ? 'Edit product' : 'New product'}</h2>
        {formError && <div className="banner banner--error">{formError}</div>}
        <div className="pf">
          <div className="pf__preview">
            <ProductImage product={{ ...values, category: values.category || 'Electronics' }} />
            <span className="muted">Preview</span>
          </div>
          <div className="form-grid">
            <div className="field field--full">
              <label htmlFor="pf-name">Name *</label>
              <input {...f('name')} />
              {err('name')}
            </div>
            <div className="field">
              <label htmlFor="pf-category">Category *</label>
              <select {...f('category')}>
                <option value="">Select…</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              {err('category')}
            </div>
            <div className="field">
              <label htmlFor="pf-brand">Brand</label>
              <input {...f('brand')} />
              {err('brand')}
            </div>
            <div className="field">
              <label htmlFor="pf-price">Price ($) *</label>
              <input inputMode="decimal" {...f('price')} />
              {err('price')}
            </div>
            <div className="field">
              <label htmlFor="pf-compareAtPrice">Compare-at price ($)</label>
              <input inputMode="decimal" placeholder="Original price, for sales" {...f('compareAtPrice')} />
              {err('compareAtPrice')}
            </div>
            <div className="field">
              <label htmlFor="pf-stock">Stock *</label>
              <input inputMode="numeric" {...f('stock')} />
              {err('stock')}
            </div>
            <div className="field">
              <label htmlFor="pf-emoji">Emoji (shown when there is no image)</label>
              <input maxLength={8} placeholder="🎧" {...f('emoji')} />
              {err('emoji')}
            </div>
            <div className="field field--full">
              <label htmlFor="pf-image">Image URL</label>
              <input placeholder="https://…" {...f('image')} />
              {err('image')}
            </div>
            <div className="field field--full">
              <label htmlFor="pf-description">Description</label>
              <textarea rows="3" maxLength={2000} {...f('description')} />
              {err('description')}
            </div>
            <label className="check">
              <input type="checkbox" checked={values.featured} onChange={(e) => set('featured', e.target.checked)} /> Featured on the home page
            </label>
            <label className="check">
              <input type="checkbox" checked={values.active} onChange={(e) => set('active', e.target.checked)} /> Visible in the store
            </label>
          </div>
        </div>
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </form>
    </div>
  );
}
