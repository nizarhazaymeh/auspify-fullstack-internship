import { useCallback, useEffect, useState } from 'react';
import { txApi } from '../api/client.js';
import { useMeta } from '../hooks/useMeta.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useTransactionActions } from '../hooks/useTransactionActions.js';
import TransactionTable from '../components/TransactionTable.jsx';
import TransactionModal from '../components/TransactionModal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Pagination from '../components/Pagination.jsx';
import RangePicker from '../components/RangePicker.jsx';
import Icon from '../components/Icon.jsx';
import { EmptyState, ErrorBanner, Spinner } from '../components/States.jsx';
import { useMoney } from '../utils/format.js';

const LIMIT = 15;
const SORTS = [
  { value: '-date', label: 'Newest first' },
  { value: 'date', label: 'Oldest first' },
  { value: '-amount', label: 'Amount: high → low' },
  { value: 'amount', label: 'Amount: low → high' },
];

export default function Transactions() {
  const { categories } = useMeta();
  const money = useMoney();
  const [range, setRange] = useState({ preset: 'all', from: '', to: '' });
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('-date');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounce(search.trim());

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);
  const refresh = useCallback(() => setReload((n) => n + 1), []);
  const actions = useTransactionActions(refresh);

  const customIncomplete = range.preset === 'custom' && (!range.from || !range.to);
  const filters = { type, category, search: q, from: range.from, to: range.to };

  // Reset to page 1 whenever the filters change.
  useEffect(() => setPage(1), [type, category, q, range.from, range.to, sort]);

  useEffect(() => {
    if (customIncomplete) return undefined;
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    txApi
      .list({ ...filters, sort, page, limit: LIMIT }, ctrl.signal)
      .then((r) => {
        if (r.data.length === 0 && page > 1 && r.pagination.total > 0) setPage(r.pagination.pages);
        else setResult(r);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err);
        setLoading(false);
      });
    return () => ctrl.abort();
  }, [type, category, q, range.from, range.to, sort, page, reload, customIncomplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const allCategories = type ? categories[type] : [...categories.expense, ...categories.income];
  const active = Boolean(type || category || q || range.preset !== 'all');

  const clear = () => {
    setType('');
    setCategory('');
    setSearch('');
    setRange({ preset: 'all', from: '', to: '' });
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Transactions</h1>
          <p className="muted">Every income and expense you&apos;ve recorded.</p>
        </div>
        <div className="page-head__actions">
          <a className="btn btn--ghost" href={txApi.exportUrl({ ...filters, sort })} download>
            <Icon name="download" /> Export CSV
          </a>
          <button type="button" className="btn btn--primary" onClick={actions.openNew}>
            <Icon name="plus" /> Add
          </button>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search">
            <Icon name="search" />
            <input type="search" placeholder="Search descriptions…" aria-label="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select aria-label="Type" value={type} onChange={(e) => { setType(e.target.value); setCategory(''); }}>
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </select>
          <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {allCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <RangePicker value={range} onChange={setRange} allowAll />
          <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {active && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={clear}>
              Clear
            </button>
          )}
        </div>

        {result && !error && (
          <div className="totals-bar">
            <span>
              Income <strong className="text-income">{money(result.totals.income)}</strong>
            </span>
            <span>
              Expenses <strong className="text-expense">{money(result.totals.expense)}</strong>
            </span>
            <span>
              Net <strong>{money(result.totals.net, { signed: true })}</strong>
            </span>
          </div>
        )}

        {error && <ErrorBanner error={error} onRetry={refresh} />}
        {customIncomplete && <p className="muted panel__empty">Pick both a start and end date.</p>}
        {loading && !result && !customIncomplete && <Spinner label="Loading transactions…" />}

        {result && !error && result.data.length === 0 && !customIncomplete && (
          <EmptyState title={active ? 'No transactions match these filters' : 'No transactions yet'}>
            {active ? (
              <button type="button" className="btn btn--ghost" onClick={clear}>
                Clear filters
              </button>
            ) : (
              <button type="button" className="btn btn--primary" onClick={actions.openNew}>
                <Icon name="plus" /> Add your first transaction
              </button>
            )}
          </EmptyState>
        )}

        {result && !error && result.data.length > 0 && (
          <div className={loading ? 'is-loading' : ''}>
            <TransactionTable items={result.data} onEdit={actions.openEdit} onDelete={actions.askDelete} />
            <Pagination {...result.pagination} onChange={setPage} />
          </div>
        )}
      </div>

      <TransactionModal {...actions.modalProps} />
      <ConfirmModal {...actions.confirmProps} />
    </>
  );
}
