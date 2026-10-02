import crypto from 'node:crypto';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import { STATUS_FLOW } from '../config/store.js';
import { shippingFor } from './cartController.js';
import { fromCents } from '../utils/money.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function newOrderNumber() {
  const d = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `ORD-${d}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

// Atomically takes stock for each item. Each decrement only succeeds if enough stock remains,
// so two customers can never buy the same last unit. On any failure, earlier decrements are undone.
async function reserveStock(items) {
  const done = [];
  for (const item of items) {
    const res = await Product.updateOne(
      { _id: item.product, active: true, stock: { $gte: item.qty } },
      { $inc: { stock: -item.qty } }
    );
    if (res.modifiedCount !== 1) {
      await Promise.all(done.map((d) => Product.updateOne({ _id: d.product }, { $inc: { stock: d.qty } })));
      return item;
    }
    done.push(item);
  }
  return null;
}

const restock = (order) =>
  Promise.all(order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } })));

// POST /api/orders — places an order from the user's cart. Prices always come from the database.
export async function checkout(req, res) {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart?.items.length) return res.status(400).json({ message: 'Your cart is empty' });

  const products = new Map((await Product.find({ _id: { $in: cart.items.map((i) => i.product) } })).map((p) => [p.id, p]));
  const problems = [];
  const items = [];
  for (const { product, qty } of cart.items) {
    const p = products.get(product.toString());
    if (!p || !p.active) problems.push('An item in your cart is no longer available');
    else if (p.stock < qty) problems.push(p.stock === 0 ? `${p.name} is out of stock` : `Only ${p.stock} of ${p.name} left`);
    else items.push({ product: p._id, name: p.name, emoji: p.emoji, image: p.image, priceCents: p.priceCents, qty });
  }
  if (problems.length) {
    return res.status(409).json({ message: 'Some items in your cart need attention', problems });
  }

  const failed = await reserveStock(items);
  if (failed) {
    return res.status(409).json({ message: `Sorry, ${failed.name} just sold out`, problems: [`${failed.name} is no longer available in that quantity`] });
  }

  const subtotalCents = items.reduce((s, i) => s + i.priceCents * i.qty, 0);
  const shippingCents = shippingFor(subtotalCents);
  let order;
  try {
    order = await Order.create({
      orderNumber: newOrderNumber(),
      user: req.user._id,
      items,
      shippingAddress: req.body.shippingAddress,
      note: req.body.note ?? '',
      subtotalCents,
      shippingCents,
      totalCents: subtotalCents + shippingCents,
      statusHistory: [{ status: 'pending', by: 'customer' }],
    });
  } catch (err) {
    await restock({ items });
    throw err;
  }

  cart.items = [];
  await cart.save();
  if (req.body.saveAddress) await User.updateOne({ _id: req.user._id }, { address: req.body.shippingAddress });

  return res.status(201).json(order);
}

// GET /api/orders — the current user's orders.
export async function listMyOrders(req, res) {
  const { page = 1, limit = 10 } = req.query;
  const filter = { user: req.user._id };
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
    Order.countDocuments(filter),
  ]);
  res.json({ data: items, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.max(1, Math.ceil(total / limit)) } });
}

// GET /api/orders/:id — owner or admin.
export async function getOrder(req, res) {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order || (req.user.role !== 'admin' && order.user._id.toString() !== req.user.id)) {
    return res.status(404).json({ message: 'Order not found' });
  }
  return res.json(order);
}

// POST /api/orders/:id/cancel — customers can cancel their own order while it's still pending.
export async function cancelMyOrder(req, res) {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, status: 'pending' },
    { $set: { status: 'cancelled' }, $push: { statusHistory: { status: 'cancelled', by: 'customer' } } },
    { returnDocument: 'after' }
  );
  if (!order) {
    const exists = await Order.exists({ _id: req.params.id, user: req.user._id });
    return exists
      ? res.status(409).json({ message: 'This order can no longer be cancelled' })
      : res.status(404).json({ message: 'Order not found' });
  }
  await restock(order);
  return res.json(order);
}

// ── Admin ──

// GET /api/admin/orders?status=&search=
export async function listAllOrders(req, res) {
  const { status, search = '', page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    const users = await User.find({ $or: [{ email: rx }, { name: rx }] }).select('_id');
    filter.$or = [{ orderNumber: rx }, { user: { $in: users.map((u) => u._id) } }, { 'shippingAddress.fullName': rx }];
  }
  const [items, total] = await Promise.all([
    Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
    Order.countDocuments(filter),
  ]);
  res.json({ data: items, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.max(1, Math.ceil(total / limit)) } });
}

// PATCH /api/admin/orders/:id/status { status }
export async function updateOrderStatus(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  const next = req.body.status;
  if (!STATUS_FLOW[order.status].includes(next)) {
    return res.status(409).json({ message: `Cannot change an order from ${order.status} to ${next}` });
  }
  // Conditional update so two admins can't apply conflicting transitions at once.
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status },
    { $set: { status: next }, $push: { statusHistory: { status: next, by: 'admin' } } },
    { returnDocument: 'after' }
  ).populate('user', 'name email');
  if (!updated) return res.status(409).json({ message: 'Order was updated by someone else. Refresh and try again.' });
  if (next === 'cancelled') await restock(updated);
  return res.json(updated);
}

// GET /api/admin/stats
export async function getStats(req, res) {
  const since = new Date(Date.now() - 29 * 86400000);
  since.setUTCHours(0, 0, 0, 0);

  const [byStatus, revenue, daily, topProducts, productCount, lowStock, customers, recent] = await Promise.all([
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$totalCents' }, count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$totalCents' }, orders: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, emoji: { $first: '$items.emoji' }, units: { $sum: '$items.qty' }, revenue: { $sum: { $multiply: ['$items.priceCents', '$items.qty'] } } } },
      { $sort: { units: -1, revenue: -1 } },
      { $limit: 5 },
    ]),
    Product.countDocuments(),
    Product.find({ stock: { $lte: 5 } }).sort({ stock: 1 }).limit(8),
    User.countDocuments({ role: 'customer' }),
    Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(5),
  ]);

  const days = [];
  for (let d = new Date(since); d <= new Date(); d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const hit = daily.find((x) => x._id === key);
    days.push({ date: key, revenue: fromCents(hit?.total ?? 0), orders: hit?.orders ?? 0 });
  }

  const rev = revenue[0] ?? { total: 0, count: 0 };
  res.json({
    revenue: fromCents(rev.total),
    orders: rev.count,
    averageOrder: rev.count ? fromCents(Math.round(rev.total / rev.count)) : 0,
    byStatus: Object.fromEntries(['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => [s, byStatus.find((x) => x._id === s)?.count ?? 0])),
    daily: days,
    topProducts: topProducts.map((p) => ({ id: p._id.toString(), name: p.name, emoji: p.emoji, units: p.units, revenue: fromCents(p.revenue) })),
    productCount,
    lowStock,
    customers,
    recentOrders: recent,
  });
}

