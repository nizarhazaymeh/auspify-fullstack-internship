import { useAuth } from '../context/AuthContext.jsx';

const formatters = new Map();

export function formatMoney(amount, currency = 'USD', { signed = false } = {}) {
  const key = `${currency}-${signed}`;
  if (!formatters.has(key)) {
    formatters.set(
      key,
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: signed ? 'exceptZero' : 'auto',
      })
    );
  }
  return formatters.get(key).format(amount ?? 0);
}

export function useMoney() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'USD';
  return (amount, opts) => formatMoney(amount, currency, opts);
}

export const formatDate = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(iso).toLocaleDateString(undefined, { ...opts, timeZone: 'UTC' });

export const formatMonth = (ym, style = 'short') =>
  new Date(`${ym}-01T00:00:00Z`).toLocaleDateString(undefined, { month: style, year: '2-digit', timeZone: 'UTC' });

export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

// Common date range presets, computed in the user's local calendar.
export function rangePreset(key) {
  const now = new Date();
  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (key) {
    case 'this-month':
      return { from: iso(new Date(y, m, 1)), to: iso(now) };
    case 'last-month':
      return { from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) };
    case '3-months':
      return { from: iso(new Date(y, m - 2, 1)), to: iso(now) };
    case '6-months':
      return { from: iso(new Date(y, m - 5, 1)), to: iso(now) };
    case 'this-year':
      return { from: iso(new Date(y, 0, 1)), to: iso(now) };
    case '12-months':
      return { from: iso(new Date(y, m - 11, 1)), to: iso(now) };
    default:
      return { from: '', to: '' };
  }
}

export const PRESETS = [
  { key: 'this-month', label: 'This month' },
  { key: 'last-month', label: 'Last month' },
  { key: '3-months', label: 'Last 3 months' },
  { key: '6-months', label: 'Last 6 months' },
  { key: 'this-year', label: 'This year' },
  { key: '12-months', label: 'Last 12 months' },
];
