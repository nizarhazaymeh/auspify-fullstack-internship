import Icon from './Icon.jsx';
import { useMoney } from '../utils/format.js';

export default function SummaryCards({ summary }) {
  const money = useMoney();
  if (!summary) return null;
  const cards = [
    { label: 'Total income', value: money(summary.income), icon: 'up', tone: 'income' },
    { label: 'Total expenses', value: money(summary.expense), icon: 'down', tone: 'expense' },
    { label: 'Balance', value: money(summary.balance), icon: 'wallet', tone: summary.balance < 0 ? 'expense' : 'neutral' },
    {
      label: 'Savings rate',
      value: summary.savingsRate == null ? '—' : `${summary.savingsRate}%`,
      icon: 'percent',
      tone: 'neutral',
      sub: `Avg. ${money(summary.averageDailyExpense)}/day spent`,
    },
  ];
  return (
    <ul className="summary">
      {cards.map((c) => (
        <li key={c.label} className={`summary__card summary__card--${c.tone}`}>
          <span className="summary__icon">
            <Icon name={c.icon} />
          </span>
          <div className="summary__text">
            <span className="summary__label">{c.label}</span>
            <strong className="summary__value">{c.value}</strong>
            {c.sub && <span className="summary__sub">{c.sub}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}
