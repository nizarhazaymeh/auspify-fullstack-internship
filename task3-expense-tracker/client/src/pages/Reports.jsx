import { useEffect, useState } from 'react';
import { txApi } from '../api/client.js';
import SummaryCards from '../components/SummaryCards.jsx';
import { CategoryChart, MonthlyChart } from '../components/Charts.jsx';
import RangePicker from '../components/RangePicker.jsx';
import Icon from '../components/Icon.jsx';
import { EmptyState, ErrorBanner, Spinner } from '../components/States.jsx';
import { formatDate, formatMonth, rangePreset, useMoney } from '../utils/format.js';
import { categoryColor } from '../utils/categoryColors.js';

function CategoryBreakdown({ title, rows, total }) {
  const money = useMoney();
  if (!rows.length) return null;
  return (
    <section className="card panel">
      <header className="panel__head">
        <h2>{title}</h2>
        <span className="muted">{money(total)}</span>
      </header>
      <ul className="breakdown">
        {rows.map((r) => (
          <li key={r.category}>
            <div className="breakdown__row">
              <span className="breakdown__name">
                <span className="legend__dot" style={{ background: categoryColor(r.category) }} />
                {r.category}
                <span className="muted"> · {r.count}</span>
              </span>
              <span className="breakdown__value">
                {money(r.total)} <span className="muted">({r.percent}%)</span>
              </span>
            </div>
            <div className="bar" aria-hidden="true">
              <span style={{ width: `${r.percent}%`, background: categoryColor(r.category) }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Reports() {
  const money = useMoney();
  const [range, setRange] = useState({ preset: '6-months', ...rangePreset('6-months') });
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);
  const incomplete = !range.from || !range.to;

  useEffect(() => {
    if (incomplete) return undefined;
    const ctrl = new AbortController();
    setError(null);
    txApi
      .summary({ from: range.from, to: range.to }, ctrl.signal)
      .then(setSummary)
      .catch((err) => err.name !== 'AbortError' && setError(err));
    return () => ctrl.abort();
  }, [range.from, range.to, reload, incomplete]);

  const expenses = summary?.byCategory.filter((c) => c.type === 'expense') ?? [];
  const incomes = summary?.byCategory.filter((c) => c.type === 'income') ?? [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Reports</h1>
          <p className="muted">Financial summaries for any period.</p>
        </div>
        <div className="page-head__actions">
          <RangePicker value={range} onChange={setRange} />
          <a className="btn btn--ghost" href={txApi.exportUrl({ from: range.from, to: range.to })} download>
            <Icon name="download" /> CSV
          </a>
        </div>
      </div>

      {error && <ErrorBanner error={error} onRetry={() => setReload((n) => n + 1)} />}
      {incomplete && <p className="muted">Pick both a start and end date.</p>}
      {!summary && !error && !incomplete && <Spinner label="Building report…" />}

      {summary && (
        <>
          <p className="muted report-range">
            {formatDate(summary.range.from)} – {formatDate(summary.range.to)} · {summary.count} transactions
          </p>
          <SummaryCards summary={summary} />

          {summary.count === 0 ? (
            <div className="card">
              <EmptyState title="No transactions in this period">
                <p className="muted">Try a different date range.</p>
              </EmptyState>
            </div>
          ) : (
            <>
              <div className="dash-grid">
                <section className="card panel panel--wide">
                  <header className="panel__head">
                    <h2>Monthly trend</h2>
                  </header>
                  <MonthlyChart monthly={summary.monthly} />
                </section>
                <section className="card panel">
                  <header className="panel__head">
                    <h2>Where it went</h2>
                  </header>
                  {expenses.length ? (
                    <CategoryChart categories={expenses} total={summary.expense} />
                  ) : (
                    <p className="muted panel__empty">No expenses in this period.</p>
                  )}
                </section>
                <section className="card panel">
                  <header className="panel__head">
                    <h2>Highlights</h2>
                  </header>
                  <dl className="highlights">
                    <div>
                      <dt>Largest expense</dt>
                      <dd>
                        {summary.largestExpense ? (
                          <>
                            {money(summary.largestExpense.amount)}
                            <span className="muted">
                              {' '}
                              · {summary.largestExpense.description || summary.largestExpense.category},{' '}
                              {formatDate(summary.largestExpense.date, { day: 'numeric', month: 'short' })}
                            </span>
                          </>
                        ) : (
                          '—'
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Top spending category</dt>
                      <dd>{expenses[0] ? `${expenses[0].category} (${expenses[0].percent}%)` : '—'}</dd>
                    </div>
                    <div>
                      <dt>Main income source</dt>
                      <dd>{incomes[0] ? `${incomes[0].category} (${incomes[0].percent}%)` : '—'}</dd>
                    </div>
                    <div>
                      <dt>Average daily spending</dt>
                      <dd>{money(summary.averageDailyExpense)}</dd>
                    </div>
                  </dl>
                </section>
              </div>

              <section className="card panel">
                <header className="panel__head">
                  <h2>Month by month</h2>
                </header>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th className="num">Income</th>
                        <th className="num">Expenses</th>
                        <th className="num">Net</th>
                        <th className="num">Saved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.monthly.map((m) => (
                        <tr key={m.month}>
                          <td>{formatMonth(m.month, 'long')}</td>
                          <td className="num text-income">{money(m.income)}</td>
                          <td className="num text-expense">{money(m.expense)}</td>
                          <td className={`num ${m.net < 0 ? 'text-expense' : ''}`}>{money(m.net, { signed: true })}</td>
                          <td className="num muted">{m.income > 0 ? `${Math.round((m.net / m.income) * 100)}%` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th>Total</th>
                        <th className="num text-income">{money(summary.income)}</th>
                        <th className="num text-expense">{money(summary.expense)}</th>
                        <th className="num">{money(summary.balance, { signed: true })}</th>
                        <th className="num">{summary.savingsRate == null ? '—' : `${Math.round(summary.savingsRate)}%`}</th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>

              <div className="two-col">
                <CategoryBreakdown title="Expenses by category" rows={expenses} total={summary.expense} />
                <CategoryBreakdown title="Income by source" rows={incomes} total={summary.income} />
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
