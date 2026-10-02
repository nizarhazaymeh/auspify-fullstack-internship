import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Order from '../src/models/Order.js';
import Cart from '../src/models/Cart.js';
import { seedStore } from '../scripts/seedHelpers.js';
import { adminUser } from '../scripts/sampleData.js';

let mongo;
const app = createApp();

const address = { fullName: 'Ali Test', phone: '+962 79 111 2222', street: '1 Main St', city: 'Amman', postalCode: '11118', country: 'Jordan' };

async function customer(email = 'ali@example.com') {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send({ name: 'Ali', email, password: 'secret123' });
  expect(res.status).toBe(201);
  return agent;
}

async function admin() {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email: adminUser.email, password: adminUser.password });
  expect(res.status).toBe(200);
  return agent;
}

const product = (over = {}) =>
  Product.create({ name: 'Test Mug', slug: `test-mug-${Math.random().toString(36).slice(2, 8)}`, priceCents: 1250, category: 'Home & Kitchen', stock: 5, ...over });

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Product.deleteMany({}), Order.deleteMany({}), Cart.deleteMany({})]);
  await seedStore();
});

describe('accounts & roles', () => {
  it('registers customers only, even if a role is sent', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Eve', email: 'eve@example.com', password: 'secret123', role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('customer');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('blocks customers and guests from admin routes', async () => {
    const c = await customer();
    expect((await c.get('/api/admin/stats')).status).toBe(403);
    expect((await c.post('/api/products').send({ name: 'Hack', price: 1, category: 'Books', stock: 1 })).status).toBe(403);
    expect((await request(app).get('/api/admin/orders')).status).toBe(401);
  });

  it('saves a profile address', async () => {
    const c = await customer();
    const res = await c.patch('/api/auth/me').send({ address });
    expect(res.status).toBe(200);
    expect(res.body.user.address).toMatchObject({ city: 'Amman', country: 'Jordan' });
  });
});

describe('catalog', () => {
  it('lists active products with category counts and pagination', async () => {
    const res = await request(app).get('/api/products?limit=5');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.pagination.total).toBe(24);
    expect(res.body.categories.find((c) => c.name === 'Electronics').count).toBe(6);
    expect(res.body.data[0]).toHaveProperty('price');
    expect(res.body.data[0]).not.toHaveProperty('priceCents');
  });

  it('category counts ignore the category and featured filters', async () => {
    const res = await request(app).get('/api/products?featured=true&category=Books');
    expect(res.body.data.every((p) => p.featured && p.category === 'Books')).toBe(true);
    expect(res.body.categories.find((c) => c.name === 'Beauty').count).toBe(2);
    expect(res.body.categories.reduce((n, c) => n + c.count, 0)).toBe(24);
  });

  it('filters by search, category, price range and stock; sorts by price', async () => {
    expect((await request(app).get('/api/products?search=headphones')).body.data[0].name).toMatch(/Headphones/);
    const books = await request(app).get('/api/products?category=Books&sort=price-asc');
    expect(books.body.data.map((p) => p.price)).toEqual([18.99, 34.99, 39.99]);
    const range = await request(app).get('/api/products?minPrice=100&maxPrice=130');
    expect(range.body.data.map((p) => p.price).sort()).toEqual([119, 129.99]);
    const inStock = await request(app).get('/api/products?inStock=true&limit=60');
    expect(inStock.body.data.every((p) => p.stock > 0)).toBe(true);
    expect(inStock.body.pagination.total).toBe(23);
  });

  it('gets a product by slug with related items; hides inactive products from customers', async () => {
    const res = await request(app).get('/api/products/atomic-habits');
    expect(res.status).toBe(200);
    expect(res.body.product.category).toBe('Books');
    expect(res.body.related.every((p) => p.category === 'Books' && p.slug !== 'atomic-habits')).toBe(true);

    const hidden = await product({ active: false });
    expect((await request(app).get(`/api/products/${hidden.id}`)).status).toBe(404);
    const a = await admin();
    expect((await a.get(`/api/products/${hidden.id}`)).status).toBe(200);
  });

  it('admin creates, updates and deletes products with unique slugs', async () => {
    const a = await admin();
    const created = await a.post('/api/products').send({ name: 'Atomic Habits', price: '9.99', category: 'Books', stock: 3 });
    expect(created.status).toBe(201);
    expect(created.body.slug).toBe('atomic-habits-2');

    const bad = await a.put(`/api/products/${created.body.id}`).send({ compareAtPrice: 5 });
    expect(bad.status).toBe(400);
    expect(bad.body.errors).toHaveProperty('compareAtPrice');

    const upd = await a.put(`/api/products/${created.body.id}`).send({ name: 'Atomic Habits (Pocket)', price: 12, compareAtPrice: 15 });
    expect(upd.body).toMatchObject({ slug: 'atomic-habits-pocket', price: 12, compareAtPrice: 15 });

    const c = await customer();
    await c.post('/api/cart/items').send({ productId: created.body.id, qty: 1 });
    expect((await a.delete(`/api/products/${created.body.id}`)).status).toBe(200);
    expect((await c.get('/api/cart')).body.items).toHaveLength(0);
  });

  it('validates product input', async () => {
    const a = await admin();
    const res = await a.post('/api/products').send({ name: 'X', price: -1, category: 'Toys', stock: 1.5, image: 'not-a-url' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.errors)).toEqual(expect.arrayContaining(['name', 'price', 'category', 'stock', 'image']));
  });
});

describe('cart', () => {
  it('adds, updates and removes items with live totals and shipping', async () => {
    const c = await customer();
    const mug = await product({ priceCents: 1250, stock: 10 });
    let res = await c.post('/api/cart/items').send({ productId: mug.id, qty: 2 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ count: 2, subtotal: 25, shipping: 5, total: 30 });

    res = await c.put(`/api/cart/items/${mug.id}`).send({ qty: 4 });
    expect(res.body).toMatchObject({ count: 4, subtotal: 50, shipping: 0, total: 50 }); // free shipping at $50

    res = await c.delete(`/api/cart/items/${mug.id}`);
    expect(res.body).toMatchObject({ count: 0, subtotal: 0, shipping: 0 });
  });

  it('refuses quantities beyond stock or the per-item limit, and out-of-stock items', async () => {
    const c = await customer();
    const mug = await product({ stock: 3 });
    expect((await c.post('/api/cart/items').send({ productId: mug.id, qty: 4 })).status).toBe(409);
    await c.post('/api/cart/items').send({ productId: mug.id, qty: 3 });
    expect((await c.post('/api/cart/items').send({ productId: mug.id, qty: 1 })).status).toBe(409);
    expect((await c.post('/api/cart/items').send({ productId: mug.id, qty: 11 })).status).toBe(400);
    const soldOut = await Product.findOne({ stock: 0 });
    expect((await c.post('/api/cart/items').send({ productId: soldOut.id })).status).toBe(409);
  });

  it('adjusts the cart when stock drops or a product is hidden, with warnings', async () => {
    const c = await customer();
    const a = await product({ name: 'Lamp', stock: 5 });
    const b = await product({ name: 'Rug', stock: 5 });
    await c.post('/api/cart/items').send({ productId: a.id, qty: 4 });
    await c.post('/api/cart/items').send({ productId: b.id, qty: 1 });
    await Product.updateOne({ _id: a._id }, { stock: 2 });
    await Product.updateOne({ _id: b._id }, { active: false });

    const res = await c.get('/api/cart');
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].qty).toBe(2);
    expect(res.body.warnings).toHaveLength(2);
    expect((await c.get('/api/cart')).body.warnings).toHaveLength(0); // fixes are saved
  });

  it('merges a guest cart, capping to stock and skipping unknown products', async () => {
    const c = await customer();
    const mug = await product({ stock: 4 });
    await c.post('/api/cart/items').send({ productId: mug.id, qty: 2 });
    const res = await c.post('/api/cart/merge').send({
      items: [
        { productId: mug.id, qty: 5 },
        { productId: new mongoose.Types.ObjectId().toString(), qty: 1 },
      ],
    });
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([expect.objectContaining({ productId: mug.id, qty: 4 })]);
  });
});

describe('orders', () => {
  async function cartWith(agent, ...items) {
    for (const [p, qty] of items) await agent.post('/api/cart/items').send({ productId: p.id, qty });
  }

  it('places an order: DB prices, stock reserved, cart cleared, address saved', async () => {
    const c = await customer();
    const mug = await product({ priceCents: 1250, stock: 5 });
    await cartWith(c, [mug, 2]);
    // Price changes after adding to cart: the order must use the current DB price.
    await Product.updateOne({ _id: mug._id }, { priceCents: 1500 });

    const res = await c.post('/api/orders').send({ shippingAddress: address, saveAddress: true, total: 0.01 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: 'pending', subtotal: 30, shipping: 5, total: 35, paymentMethod: 'Cash on Delivery' });
    expect(res.body.orderNumber).toMatch(/^ORD-\d{6}-[0-9A-F]{6}$/);
    expect(res.body.items[0]).toMatchObject({ name: 'Test Mug', price: 15, qty: 2, lineTotal: 30 });

    expect((await Product.findById(mug._id)).stock).toBe(3);
    expect((await c.get('/api/cart')).body.count).toBe(0);
    expect((await c.get('/api/auth/me')).body.user.address.city).toBe('Amman');
  });

  it('rejects empty carts and invalid addresses', async () => {
    const c = await customer();
    expect((await c.post('/api/orders').send({ shippingAddress: address })).status).toBe(400);
    const mug = await product();
    await cartWith(c, [mug, 1]);
    const res = await c.post('/api/orders').send({ shippingAddress: { ...address, phone: 'abc', city: '' } });
    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty(['shippingAddress.phone']);
    expect(res.body.errors).toHaveProperty(['shippingAddress.city']);
  });

  it('never oversells: the last unit goes to one buyer and nothing is partially reserved', async () => {
    const lamp = await product({ name: 'Lamp', stock: 1 });
    const rug = await product({ name: 'Rug', stock: 5 });
    const c1 = await customer('one@example.com');
    const c2 = await customer('two@example.com');
    await cartWith(c1, [rug, 2], [lamp, 1]);
    await cartWith(c2, [rug, 1], [lamp, 1]);

    const [r1, r2] = await Promise.all([
      c1.post('/api/orders').send({ shippingAddress: address }),
      c2.post('/api/orders').send({ shippingAddress: address }),
    ]);
    expect([r1.status, r2.status].sort()).toEqual([201, 409]);
    expect((await Product.findById(lamp._id)).stock).toBe(0);
    // Only the winning order's rug quantity was taken; the loser's reservation was rolled back.
    const winnerRugQty = r1.status === 201 ? 2 : 1;
    expect((await Product.findById(rug._id)).stock).toBe(5 - winnerRugQty);
    expect(await Order.countDocuments({ 'items.product': lamp._id })).toBe(1);
  });

  it('customers see only their own orders', async () => {
    const c1 = await customer('one@example.com');
    const c2 = await customer('two@example.com');
    const mug = await product();
    await cartWith(c1, [mug, 1]);
    const { body } = await c1.post('/api/orders').send({ shippingAddress: address });

    expect((await c1.get('/api/orders')).body.data).toHaveLength(1);
    expect((await c2.get('/api/orders')).body.data).toHaveLength(0);
    expect((await c2.get(`/api/orders/${body.id}`)).status).toBe(404);
    expect((await c2.post(`/api/orders/${body.id}/cancel`)).status).toBe(404);
  });

  it('customer can cancel a pending order (stock returned) but not after processing starts', async () => {
    const c = await customer();
    const a = await admin();
    const mug = await product({ stock: 5 });
    await cartWith(c, [mug, 2]);
    const first = (await c.post('/api/orders').send({ shippingAddress: address })).body;
    const cancelled = await c.post(`/api/orders/${first.id}/cancel`);
    expect(cancelled.body.status).toBe('cancelled');
    expect((await Product.findById(mug._id)).stock).toBe(5);
    expect((await c.post(`/api/orders/${first.id}/cancel`)).status).toBe(409);

    await cartWith(c, [mug, 1]);
    const second = (await c.post('/api/orders').send({ shippingAddress: address })).body;
    await a.patch(`/api/admin/orders/${second.id}/status`).send({ status: 'processing' });
    expect((await c.post(`/api/orders/${second.id}/cancel`)).status).toBe(409);
  });

  it('admin moves orders through allowed statuses only; admin cancel restocks', async () => {
    const c = await customer();
    const a = await admin();
    const mug = await product({ stock: 5 });
    await cartWith(c, [mug, 3]);
    const order = (await c.post('/api/orders').send({ shippingAddress: address })).body;

    expect((await a.patch(`/api/admin/orders/${order.id}/status`).send({ status: 'delivered' })).status).toBe(409);
    expect((await a.patch(`/api/admin/orders/${order.id}/status`).send({ status: 'processing' })).body.status).toBe('processing');
    const cancelled = await a.patch(`/api/admin/orders/${order.id}/status`).send({ status: 'cancelled' });
    expect(cancelled.body.status).toBe('cancelled');
    expect(cancelled.body.statusHistory.map((h) => h.status)).toEqual(['pending', 'processing', 'cancelled']);
    expect((await Product.findById(mug._id)).stock).toBe(5);
    expect((await a.patch(`/api/admin/orders/${order.id}/status`).send({ status: 'processing' })).status).toBe(409);
  });

  it('admin lists and searches all orders', async () => {
    const a = await admin();
    const all = await a.get('/api/admin/orders');
    expect(all.body.pagination.total).toBe(6);
    expect(all.body.data[0].user).toMatchObject({ email: 'demo@example.com' });
    expect((await a.get('/api/admin/orders?status=pending')).body.data).toHaveLength(1);
    expect((await a.get('/api/admin/orders?search=SEED-003')).body.data).toHaveLength(1);
    expect((await a.get('/api/admin/orders?search=demo@example')).body.pagination.total).toBe(6);
  });
});

describe('admin stats', () => {
  it('reports revenue excluding cancelled orders, status counts, low stock and top products', async () => {
    const a = await admin();
    const res = await a.get('/api/admin/stats');
    expect(res.status).toBe(200);
    const orders = await Order.find({ status: { $ne: 'cancelled' } });
    const expected = orders.reduce((s, o) => s + o.totalCents, 0) / 100;
    expect(res.body.revenue).toBeCloseTo(expected, 2);
    expect(res.body.orders).toBe(5);
    expect(res.body.byStatus).toEqual({ pending: 1, processing: 1, shipped: 1, delivered: 2, cancelled: 1 });
    expect(res.body.daily).toHaveLength(30);
    expect(res.body.lowStock.every((p) => p.stock <= 5)).toBe(true);
    expect(res.body.lowStock[0].stock).toBe(0);
    expect(res.body.topProducts.length).toBeGreaterThan(0);
    expect(res.body.customers).toBe(1);
  });
});
