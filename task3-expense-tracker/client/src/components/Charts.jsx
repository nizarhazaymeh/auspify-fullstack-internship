import { useEffect, useState } from 'react';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { formatMonth, useMoney } from '../utils/format.js';
import { categoryColor } from '../utils/categoryColors.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, LineElement, PointElement, Tooltip);

// Read theme colors from CSS variables so charts follow light/dark mode.
function useThemeColors() {
  const read = () => {
    const s = getComputedStyle(document.documentElement);
    const v = (n) => s.getPropertyValue(n).trim();
    return { text: v('--muted'), grid: v('--border'), income: v('--income'), expense: v('--expense'), surface: v('--surface') };
  };
  const [colors, setColors] = useState(read);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setColors(read());
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return colors;
}

export function MonthlyChart({ monthly }) {
  const c = useThemeColors();
  const money = useMoney();
  const data = {
    labels: monthly.map((m) => formatMonth(m.month)),
    datasets: [
      { label: 'Income', data: monthly.map((m) => m.income), backgroundColor: c.income, borderRadius: 6, maxBarThickness: 28 },
      { label: 'Expenses', data: monthly.map((m) => m.expense), backgroundColor: c.expense, borderRadius: 6, maxBarThickness: 28 },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', align: 'end', labels: { color: c.text, boxWidth: 12, boxHeight: 12, useBorderRadius: true, borderRadius: 3 } },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${money(ctx.parsed.y)}` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: c.text } },
      y: { beginAtZero: true, grid: { color: c.grid }, border: { display: false }, ticks: { color: c.text, maxTicksLimit: 6 } },
    },
  };
  return (
    <div className="chart chart--bar" role="img" aria-label="Monthly income and expenses bar chart">
      <Bar data={data} options={options} />
    </div>
  );
}

export function CategoryChart({ categories, total }) {
  const c = useThemeColors();
  const money = useMoney();
  const data = {
    labels: categories.map((x) => x.category),
    datasets: [
      {
        data: categories.map((x) => x.total),
        backgroundColor: categories.map((x) => categoryColor(x.category)),
        borderColor: c.surface,
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${money(ctx.parsed)}` } },
    },
  };
  return (
    <div className="donut">
      <div className="chart chart--donut" role="img" aria-label="Spending by category doughnut chart">
        <Doughnut data={data} options={options} />
        <div className="donut__center">
          <span>Spent</span>
          <strong>{money(total)}</strong>
        </div>
      </div>
      <ul className="legend">
        {categories.slice(0, 6).map((x) => (
          <li key={x.category}>
            <span className="legend__dot" style={{ background: categoryColor(x.category) }} />
            <span className="legend__name">{x.category}</span>
            <span className="legend__pct">{x.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
