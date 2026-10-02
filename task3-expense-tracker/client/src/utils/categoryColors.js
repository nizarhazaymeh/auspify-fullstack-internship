// Fixed color per category so charts and badges stay consistent across pages.
const palette = {
  Salary: '#0d9488',
  Freelance: '#2563eb',
  Business: '#7c3aed',
  Investments: '#0891b2',
  Gifts: '#db2777',
  Refunds: '#65a30d',
  'Other Income': '#64748b',
  'Food & Dining': '#f97316',
  Groceries: '#16a34a',
  Transport: '#0ea5e9',
  'Housing & Rent': '#6366f1',
  Utilities: '#eab308',
  Shopping: '#ec4899',
  Entertainment: '#a855f7',
  Health: '#ef4444',
  Education: '#14b8a6',
  Travel: '#06b6d4',
  Subscriptions: '#8b5cf6',
  'Other Expense': '#94a3b8',
};

export const categoryColor = (c) => palette[c] ?? '#94a3b8';
