import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import { fromCents, toCents } from '../utils/money.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const day = (s) => new Date(`${s}T00:00:00.000Z`);
const endOfDay = (s) => new Date(`${s}T23:59:59.999Z`);

function rangeFilter({ from, to }) {
  if (!from && !to) return undefined;
  const date = {};
  if (from) date.$gte = day(from);
  if (to) date.$lte = endOfDay(to);
  return date;
}

function buildFilter(userId, q) {
  const filter = { user: userId };
  const date = rangeFilter(q);
  if (date) filter.date = date;
  if (q.type) filter.type = q.type;
  if (q.category) filter.category = q.category;
  if (q.search?.trim()) filter.description = new RegExp(escapeRegex(q.search.trim()), 'i');
  return filter;
}

function applyBody(tx, body) {
  if (body.type !== undefined) tx.type = body.type;
  if (body.amount !== undefined) tx.amountCents = toCents(body.amount);
  if (body.category !== undefined) tx.category = body.category;
  if (body.date !== undefined) tx.date = day(body.date);
  if (body.description !== undefined) tx.description = body.description;
  if (body.paymentMethod !== undefined) tx.paymentMethod = body.paymentMethod || null;
}

const notFound = (res) => res.status(404).json({ message: 'Transaction not found' });

// GET /api/transactions
export async function listTransactions(req, res) {
  const { page = 1, limit = 10, sort = '-date' } = req.query;
  const filter = buildFilter(req.user._id, req.query);
  const sortKey = sort.replace('amount', 'amountCents');
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const [items, total, totals] = await Promise.all([
    Transaction.find(filter).sort(`${sortKey} -createdAt _id`).skip((pageNum - 1) * limitNum).limit(limitNum),
    Transaction.countDocuments(filter),
    Transaction.aggregate([{ $match: filter }, { $group: { _id: '$type', total: { $sum: '$amountCents' } } }]),
  ]);

  const cents = (t) => totals.find((x) => x._id === t)?.total ?? 0;
  res.json({
    data: items,
    totals: {
      income: fromCents(cents('income')),
      expense: fromCents(cents('expense')),
      net: fromCents(cents('income') - cents('expense')),
    },
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.max(1, Math.ceil(total / limitNum)) },
  });
}

// GET /api/transactions/:id
export async function getTransaction(req, res) {
  const tx = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
  if (!tx) return notFound(res);
  return res.json(tx);
}

// POST /api/transactions
export async function createTransaction(req, res) {
  const tx = new Transaction({ user: req.user._id });
  applyBody(tx, req.body);
  await tx.save();
  res.status(201).json(tx);
}

// PUT /api/transactions/:id — loads then saves so the category/type check sees the merged document.
export async function updateTransaction(req, res) {
  const tx = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
  if (!tx) return notFound(res);
  applyBody(tx, req.body);
  await tx.save();
  return res.json(tx);
}

// DELETE /api/transactions/:id
export async function deleteTransaction(req, res) {
  const tx = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!tx) return notFound(res);
  return res.json({ message: 'Transaction deleted', id: tx.id });
}

// Months between two dates inclusive, as 'YYYY-MM'.
function monthKeys(start, end) {
  const keys = [];
  const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  while (d <= end) {
    keys.push(d.toISOString().slice(0, 7));
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return keys;
}

// GET /api/transactions/summary?from=&to=
// Defaults to the last 6 calendar months (including the current one).
export async function getSummary(req, res) {
  const now = new Date();
  const from = req.query.from || new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1)).toISOString().slice(0, 10);
  const to = req.query.to || now.toISOString().slice(0, 10);
  const match = { user: new mongoose.Types.ObjectId(req.user.id), date: rangeFilter({ from, to }) };

  const [result] = await Transaction.aggregate([
    { $match: match },
    {
      $facet: {
        totals: [{ $group: { _id: '$type', total: { $sum: '$amountCents' }, count: { $sum: 1 } } }],
        byCategory: [
          { $group: { _id: { type: '$type', category: '$category' }, total: { $sum: '$amountCents' }, count: { $sum: 1 } } },
          { $sort: { total: -1 } },
        ],
        monthly: [
          {
            $group: {
              _id: { month: { $dateToString: { format: '%Y-%m', date: '$date' } }, type: '$type' },
              total: { $sum: '$amountCents' },
            },
          },
        ],
        largestExpense: [{ $match: { type: 'expense' } }, { $sort: { amountCents: -1 } }, { $limit: 1 }],
      },
    },
  ]);

  const total = (type) => result.totals.find((t) => t._id === type)?.total ?? 0;
  const incomeC = total('income');
  const expenseC = total('expense');

  const monthly = monthKeys(day(from), endOfDay(to)).map((month) => {
    const get = (type) => result.monthly.find((m) => m._id.month === month && m._id.type === type)?.total ?? 0;
    const inc = get('income');
    const exp = get('expense');
    return { month, income: fromCents(inc), expense: fromCents(exp), net: fromCents(inc - exp) };
  });

  const days = Math.max(1, Math.round((endOfDay(to) - day(from)) / 86400000));
  const largest = result.largestExpense[0];

  res.json({
    range: { from, to },
    income: fromCents(incomeC),
    expense: fromCents(expenseC),
    balance: fromCents(incomeC - expenseC),
    savingsRate: incomeC > 0 ? Math.round(((incomeC - expenseC) / incomeC) * 1000) / 10 : null,
    count: result.totals.reduce((n, t) => n + t.count, 0),
    averageDailyExpense: fromCents(Math.round(expenseC / days)),
    largestExpense: largest
      ? { amount: fromCents(largest.amountCents), category: largest.category, description: largest.description, date: largest.date }
      : null,
    byCategory: result.byCategory.map((c) => ({
      type: c._id.type,
      category: c._id.category,
      total: fromCents(c.total),
      count: c.count,
      percent: Math.round((c.total / (c._id.type === 'income' ? incomeC : expenseC)) * 1000) / 10,
    })),
    monthly,
  });
}

// GET /api/transactions/export — CSV of the filtered transactions.
export async function exportCsv(req, res) {
  const items = await Transaction.find(buildFilter(req.user._id, req.query)).sort('-date -createdAt').limit(10000).lean();
  const cell = (v) => {
    if (typeof v === 'number') return String(v);
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // prevent spreadsheet formula injection
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [
    ['Date', 'Type', 'Category', 'Description', 'Payment Method', 'Amount'],
    ...items.map((t) => [
      t.date.toISOString().slice(0, 10),
      t.type,
      t.category,
      t.description,
      t.paymentMethod ?? '',
      (t.type === 'expense' ? -1 : 1) * fromCents(t.amountCents),
    ]),
  ];
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="transactions-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(rows.map((r) => r.map(cell).join(',')).join('\n'));
}
