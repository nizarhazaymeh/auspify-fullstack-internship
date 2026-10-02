import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { txApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import SummaryCards from '../components/SummaryCards.jsx';
import { CategoryChart, MonthlyChart } from '../components/Charts.jsx';
import TransactionTable from '../components/TransactionTable.jsx';
import TransactionModal from '../components/TransactionModal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Icon from '../components/Icon.jsx';
import { EmptyState, ErrorBanner, Spinner } from '../components/States.jsx';
import { useTransactionActions } from '../hooks/useTransactionActions.js';
import { rangePreset, useMoney } from '../utils/format.js';

export default function Dashboard() {
  const { user } = useAuth();
  const money = useMoney();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);
  const refresh = useCallback(() => setReload((n) => n + 1), []);
  const actions = useTransactionActions(refresh);

  useEffect(() => {
    const ctrl = new AbortController();
    const month = rangePreset('this-month');
    setError(null);
    Promise.all([
      txApi.summary(rangePreset('6-months'), ctrl.signal),
      txApi.summary(month, ctrl.signal),
      txApi.list({ limit: 6 }, ctrl.signal),
    ])
      .then(([six, thisMonth, recent]) => setData({ six, thisMonth, recent: recent.data }))
      .catch((err) => err.name !== 'AbortError' && setError(err));
    return () => ctrl.abort();
  }, [reload]);

  const first = user.name.split(' ')[0];
  const expenseCats = data?.six.byCategory.filter((c) => c.type === 'expense') ?? [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Hi, {first} 👋</h1>
          <p className="muted">Here&apos;s your financial overview for the last 6 months.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={actions.openNew}>
          <Icon name="plus" /> Add transaction
        </button>
      </div>

      {error && <ErrorBanner error={error} onRetry={refresh} />}
      {!data && !error && <Spinner label="Loading your dashboard…" />}

      {data && (
        <>
          <SummaryCards summary={data.six} />

          <div className="month-strip card">
            <div>
              <span className="muted">This month</span>
              <strong>{money(data.thisMonth.balance, { signed: true })}</strong>
            </div>
            <div>
              <span className="muted">Income</span>
              <strong className="text-income">{money(data.thisMonth.income)}</strong>
            </div>
            <div>
              <span className="muted">Spent</span>
              <strong className="text-expense">{money(data.thisMonth.expense)}</strong>
            </div>
            <div>
              <span className="muted">Transactions</span>
              <strong>{data.thisMonth.count}</strong>
            </div>
          </div>

          {data.six.count === 0 ? (
            <div className="card">
              <EmptyState title="No transactions yet">
                <p className="muted">Add your first income or expense to see charts and insights.</p>
                <button type="button" className="btn btn--primary" onClick={actions.openNew}>
                  <Icon name="plus" /> Add transaction
                </button>
              </EmptyState>
            </div>
          ) : (
            <div className="dash-grid">
              <section className="card panel panel--wide">
                <header className="panel__head">
                  <h2>Income vs expenses</h2>
                </header>
                <MonthlyChart monthly={data.six.monthly} />
              </section>

              <section className="card panel">
                <header className="panel__head">
                  <h2>Spending by category</h2>
                </header>
                {expenseCats.length ? (
                  <CategoryChart categories={expenseCats} total={data.six.expense} />
                ) : (
                  <p className="muted panel__empty">No expenses in this period.</p>
                )}
              </section>

              <section className="card panel">
                <header className="panel__head">
                  <h2>Recent transactions</h2>
                  <Link to="/transactions">View all</Link>
                </header>
                <TransactionTable items={data.recent} onEdit={actions.openEdit} compact />
              </section>
            </div>
          )}
        </>
      )}

      <TransactionModal {...actions.modalProps} />
      <ConfirmModal {...actions.confirmProps} />
    </>
  );
}
