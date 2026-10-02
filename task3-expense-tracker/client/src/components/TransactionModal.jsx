import { useEffect, useRef, useState } from 'react';
import { useMeta } from '../hooks/useMeta.js';
import { todayISO } from '../utils/format.js';

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

const blank = (type = 'expense') => ({
  type,
  amount: '',
  category: '',
  date: todayISO(),
  description: '',
  paymentMethod: '',
});

function toValues(tx) {
  if (!tx) return blank();
  return {
    type: tx.type,
    amount: String(tx.amount),
    category: tx.category,
    date: tx.date.slice(0, 10),
    description: tx.description ?? '',
    paymentMethod: tx.paymentMethod ?? '',
  };
}

function validate(v) {
  const e = {};
  if (!AMOUNT_RE.test(v.amount.trim()) || Number(v.amount) <= 0) e.amount = 'Enter a positive amount (max 2 decimals).';
  if (!v.category) e.category = 'Choose a category.';
  if (!v.date) e.date = 'Choose a date.';
  if (v.description.length > 120) e.description = 'Keep it under 120 characters.';
  return e;
}

export default function TransactionModal({ open, transaction, onClose, onSave }) {
  const { categories, paymentMethods } = useMeta();
  const [values, setValues] = useState(blank);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const firstRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setValues(toValues(transaction));
    setErrors({});
    setSubmitted(false);
    setFormError('');
    setSaving(false);
    setTimeout(() => firstRef.current?.focus(), 0);
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, transaction, onClose]);

  if (!open) return null;

  const set = (patch) => {
    const next = { ...values, ...patch };
    setValues(next);
    if (submitted) setErrors(validate(next));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setFormError('');
    try {
      await onSave({ ...values, amount: values.amount.trim(), description: values.description.trim() });
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      setFormError(err.message);
      setSaving(false);
    }
  };

  const field = (name) => ({
    id: `tx-${name}`,
    value: values[name],
    onChange: (e) => set({ [name]: e.target.value }),
    'aria-invalid': Boolean(errors[name]),
  });
  const err = (name) => errors[name] && <p className="field__error">{errors[name]}</p>;

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <form className="modal modal--form" role="dialog" aria-modal="true" aria-labelledby="tx-title" onSubmit={submit} noValidate>
        <h2 id="tx-title">{transaction ? 'Edit transaction' : 'Add transaction'}</h2>

        {formError && <div className="banner banner--error">{formError}</div>}

        <div className="segmented" role="radiogroup" aria-label="Type">
          {['expense', 'income'].map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={values.type === t}
              className={`segmented__btn segmented__btn--${t} ${values.type === t ? 'is-active' : ''}`}
              onClick={() => set({ type: t, category: values.type === t ? values.category : '' })}
            >
              {t === 'expense' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="tx-amount">Amount *</label>
            <input ref={firstRef} type="text" inputMode="decimal" placeholder="0.00" autoComplete="off" {...field('amount')} />
            {err('amount')}
          </div>
          <div className="field">
            <label htmlFor="tx-date">Date *</label>
            <input type="date" {...field('date')} />
            {err('date')}
          </div>
          <div className="field">
            <label htmlFor="tx-category">Category *</label>
            <select {...field('category')}>
              <option value="">Select…</option>
              {categories[values.type].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            {err('category')}
          </div>
          <div className="field">
            <label htmlFor="tx-paymentMethod">Payment method</label>
            <select {...field('paymentMethod')}>
              <option value="">—</option>
              {paymentMethods.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            {err('paymentMethod')}
          </div>
          <div className="field field--full">
            <label htmlFor="tx-description">Description</label>
            <input type="text" maxLength={120} placeholder="e.g. Weekly groceries" autoComplete="off" {...field('description')} />
            {err('description')}
          </div>
        </div>

        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Saving…' : transaction ? 'Save changes' : 'Add transaction'}
          </button>
        </div>
      </form>
    </div>
  );
}
