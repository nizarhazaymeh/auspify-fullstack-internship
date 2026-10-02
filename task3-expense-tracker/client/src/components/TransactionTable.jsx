import Icon from './Icon.jsx';
import { formatDate, useMoney } from '../utils/format.js';
import { categoryColor } from '../utils/categoryColors.js';

export default function TransactionTable({ items, onEdit, onDelete, compact = false }) {
  const money = useMoney();
  return (
    <ul className={`tx-list ${compact ? 'tx-list--compact' : ''}`}>
      {items.map((t) => (
        <li key={t.id} className="tx">
          <span className="tx__dot" style={{ background: categoryColor(t.category) }} aria-hidden="true">
            {t.category[0]}
          </span>
          <div className="tx__main">
            <span className="tx__title">{t.description || t.category}</span>
            <span className="tx__meta">
              {t.category} · {formatDate(t.date)}
              {t.paymentMethod && !compact ? ` · ${t.paymentMethod}` : ''}
            </span>
          </div>
          <span className={`tx__amount tx__amount--${t.type}`}>
            {money(t.type === 'expense' ? -t.amount : t.amount, { signed: true })}
          </span>
          {(onEdit || onDelete) && (
            <div className="tx__actions">
              {onEdit && (
                <button type="button" className="icon-btn" onClick={() => onEdit(t)} aria-label={`Edit ${t.description || t.category}`}>
                  <Icon name="edit" size={16} />
                </button>
              )}
              {onDelete && (
                <button type="button" className="icon-btn icon-btn--danger" onClick={() => onDelete(t)} aria-label={`Delete ${t.description || t.category}`}>
                  <Icon name="trash" size={16} />
                </button>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
