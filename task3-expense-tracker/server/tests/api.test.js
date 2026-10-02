import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import User from '../src/models/User.js';
import Transaction from '../src/models/Transaction.js';

let mongo;
const app = createApp();

const alice = { name: 'Alice', email: 'Alice@Example.com', password: 'secret123' };
const bob = { name: 'Bob', email: 'bob@example.com', password: 'secret456' };

// Registers a user and returns a supertest agent that keeps the auth cookie.
async function loggedIn(user = alice) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send(user);
  expect(res.status).toBe(201);
  return agent;
}

const tx = (over = {}) => ({
  type: 'expense',
  amount: 12.5,
  category: 'Groceries',
  date: '2026-09-15',
  description: 'Supermarket',
  ...over,
});

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await User.syncIndexes();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Transaction.deleteMany({})]);
});

describe('auth', () => {
  it('registers, sets an httpOnly cookie, and never returns the password', async () => {
    const res = await request(app).post('/api/auth/register').send(alice);
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ name: 'Alice', email: 'alice@example.com', currency: 'USD' });
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.headers['set-cookie'][0]).toMatch(/token=.+HttpOnly/i);

    const stored = await User.findOne({ email: 'alice@example.com' }).select('+password');
    expect(stored.password).not.toBe(alice.password);
  });

  it('rejects weak passwords and invalid emails', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'A', email: 'nope', password: 'short' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.errors)).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  it('rejects duplicate emails with 409', async () => {
    await request(app).post('/api/auth/register').send(alice);
    const res = await request(app).post('/api/auth/register').send({ ...alice, email: 'alice@example.com' });
    expect(res.status).toBe(409);
  });

  it('logs in with correct credentials only', async () => {
    await request(app).post('/api/auth/register').send(alice);
    const bad = await request(app).post('/api/auth/login').send({ email: alice.email, password: 'wrong-pass1' });
    expect(bad.status).toBe(401);
    const unknown = await request(app).post('/api/auth/login').send({ email: 'ghost@example.com', password: 'whatever1' });
    expect(unknown.status).toBe(401);
    expect(unknown.body.message).toBe(bad.body.message);

    const ok = await request(app).post('/api/auth/login').send({ email: alice.email, password: alice.password });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeTruthy();
  });

  it('GET /me requires a session; logout clears it', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    const agent = await loggedIn();
    expect((await agent.get('/api/auth/me')).body.user.name).toBe('Alice');
    await agent.post('/api/auth/logout');
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });

  it('GET /session returns the user or null without a 401', async () => {
    const anon = await request(app).get('/api/auth/session');
    expect(anon.status).toBe(200);
    expect(anon.body.user).toBeNull();
    const agent = await loggedIn();
    expect((await agent.get('/api/auth/session')).body.user.name).toBe('Alice');
    const bad = await request(app).get('/api/auth/session').set('Cookie', 'token=garbage');
    expect(bad.status).toBe(200);
    expect(bad.body.user).toBeNull();
  });

  it('accepts a Bearer token and rejects a tampered one', async () => {
    const { body } = await request(app).post('/api/auth/register').send(alice);
    const ok = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.token}`);
    expect(ok.status).toBe(200);
    const bad = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.token}x`);
    expect(bad.status).toBe(401);
  });

  it('updates profile and changes password', async () => {
    const agent = await loggedIn();
    const p = await agent.patch('/api/auth/me').send({ name: 'Alice B', currency: 'JOD' });
    expect(p.body.user).toMatchObject({ name: 'Alice B', currency: 'JOD' });

    const wrong = await agent.post('/api/auth/change-password').send({ currentPassword: 'nope', newPassword: 'newpass123' });
    expect(wrong.status).toBe(400);
    expect(wrong.body.errors).toHaveProperty('currentPassword');

    const ok = await agent.post('/api/auth/change-password').send({ currentPassword: alice.password, newPassword: 'newpass123' });
    expect(ok.status).toBe(200);
    const login = await request(app).post('/api/auth/login').send({ email: alice.email, password: 'newpass123' });
    expect(login.status).toBe(200);
  });

  it('deleting the account removes its transactions', async () => {
    const agent = await loggedIn();
    await agent.post('/api/transactions').send(tx());
    await agent.delete('/api/auth/me');
    expect(await Transaction.countDocuments()).toBe(0);
    expect(await User.countDocuments()).toBe(0);
  });
});

describe('transactions CRUD', () => {
  it('requires authentication', async () => {
    expect((await request(app).get('/api/transactions')).status).toBe(401);
    expect((await request(app).post('/api/transactions').send(tx())).status).toBe(401);
  });

  it('creates, reads, updates and deletes', async () => {
    const agent = await loggedIn();
    const created = await agent.post('/api/transactions').send(tx({ amount: '19.99', paymentMethod: 'Card' }));
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ amount: 19.99, type: 'expense', category: 'Groceries', paymentMethod: 'Card' });
    expect(created.body.date).toBe('2026-09-15T00:00:00.000Z');
    const { id } = created.body;

    expect((await agent.get(`/api/transactions/${id}`)).body.amount).toBe(19.99);

    const updated = await agent.put(`/api/transactions/${id}`).send({ amount: 25, description: 'Updated' });
    expect(updated.body).toMatchObject({ amount: 25, description: 'Updated', category: 'Groceries' });

    expect((await agent.delete(`/api/transactions/${id}`)).status).toBe(200);
    expect((await agent.get(`/api/transactions/${id}`)).status).toBe(404);
  });

  it('validates amount, date and category', async () => {
    const agent = await loggedIn();
    const res = await agent.post('/api/transactions').send(tx({ amount: -5, date: '15/09/2026', category: 'Pizza' }));
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.errors)).toEqual(expect.arrayContaining(['amount', 'date', 'category']));

    const decimals = await agent.post('/api/transactions').send(tx({ amount: 1.234 }));
    expect(decimals.status).toBe(400);
  });

  it('rejects a category that does not match the type, including on partial update', async () => {
    const agent = await loggedIn();
    const res = await agent.post('/api/transactions').send(tx({ type: 'income', category: 'Groceries' }));
    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('category');

    const { body } = await agent.post('/api/transactions').send(tx());
    const flip = await agent.put(`/api/transactions/${body.id}`).send({ type: 'income' });
    expect(flip.status).toBe(400);
    const both = await agent.put(`/api/transactions/${body.id}`).send({ type: 'income', category: 'Salary' });
    expect(both.status).toBe(200);
  });

  it("isolates users: Bob cannot see or modify Alice's transactions", async () => {
    const a = await loggedIn(alice);
    const b = await loggedIn(bob);
    const { body } = await a.post('/api/transactions').send(tx());

    expect((await b.get('/api/transactions')).body.data).toHaveLength(0);
    expect((await b.get(`/api/transactions/${body.id}`)).status).toBe(404);
    expect((await b.put(`/api/transactions/${body.id}`).send({ amount: 1 })).status).toBe(404);
    expect((await b.delete(`/api/transactions/${body.id}`)).status).toBe(404);
    expect((await a.get(`/api/transactions/${body.id}`)).body.amount).toBe(12.5);
  });

  it('ignores attempts to set the owner from the request body', async () => {
    const a = await loggedIn(alice);
    const b = await loggedIn(bob);
    const bobId = (await b.get('/api/auth/me')).body.user.id;
    await a.post('/api/transactions').send({ ...tx(), user: bobId });
    expect((await b.get('/api/transactions')).body.data).toHaveLength(0);
  });
});

describe('listing, filters and totals', () => {
  let agent;
  beforeEach(async () => {
    agent = await loggedIn();
    for (const t of [
      tx({ type: 'income', category: 'Salary', amount: 1000, date: '2026-08-01', description: 'Pay' }),
      tx({ amount: 0.1, date: '2026-08-02', description: 'Gum' }),
      tx({ amount: 0.2, date: '2026-08-03', description: 'Candy' }),
      tx({ category: 'Transport', amount: 30, date: '2026-09-05', description: 'Taxi ride' }),
      tx({ type: 'income', category: 'Freelance', amount: 250.75, date: '2026-09-10', description: 'Logo' }),
    ]) {
      await agent.post('/api/transactions').send(t);
    }
  });

  it('returns newest first with totals for the filter (exact cents)', async () => {
    const res = await agent.get('/api/transactions');
    expect(res.body.data.map((t) => t.description)).toEqual(['Logo', 'Taxi ride', 'Candy', 'Gum', 'Pay']);
    expect(res.body.totals).toEqual({ income: 1250.75, expense: 30.3, net: 1220.45 });
  });

  it('filters by type, category, date range and search', async () => {
    expect((await agent.get('/api/transactions?type=income')).body.data).toHaveLength(2);
    expect((await agent.get('/api/transactions?category=Transport')).body.data[0].description).toBe('Taxi ride');
    const aug = await agent.get('/api/transactions?from=2026-08-01&to=2026-08-31');
    expect(aug.body.data).toHaveLength(3);
    expect(aug.body.totals.expense).toBe(0.3);
    expect((await agent.get('/api/transactions?search=TAXI')).body.data).toHaveLength(1);
  });

  it('sorts by amount and paginates', async () => {
    const res = await agent.get('/api/transactions?sort=-amount&limit=2&page=1');
    expect(res.body.data.map((t) => t.amount)).toEqual([1000, 250.75]);
    expect(res.body.pagination).toEqual({ page: 1, limit: 2, total: 5, pages: 3 });
  });

  it('rejects an inverted date range', async () => {
    const res = await agent.get('/api/transactions?from=2026-09-01&to=2026-08-01');
    expect(res.status).toBe(400);
  });

  it('summary aggregates totals, categories and months', async () => {
    const res = await agent.get('/api/transactions/summary?from=2026-08-01&to=2026-09-30');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ income: 1250.75, expense: 30.3, balance: 1220.45, count: 5, savingsRate: 97.6 });
    expect(res.body.monthly).toEqual([
      { month: '2026-08', income: 1000, expense: 0.3, net: 999.7 },
      { month: '2026-09', income: 250.75, expense: 30, net: 220.75 },
    ]);
    const transport = res.body.byCategory.find((c) => c.category === 'Transport');
    expect(transport).toMatchObject({ type: 'expense', total: 30, count: 1, percent: 99 });
    expect(res.body.largestExpense).toMatchObject({ amount: 30, category: 'Transport' });
  });

  it('summary fills empty months with zeros', async () => {
    const res = await agent.get('/api/transactions/summary?from=2026-06-01&to=2026-07-31');
    expect(res.body.monthly).toEqual([
      { month: '2026-06', income: 0, expense: 0, net: 0 },
      { month: '2026-07', income: 0, expense: 0, net: 0 },
    ]);
    expect(res.body.savingsRate).toBeNull();
  });

  it('exports CSV with signed amounts and escapes formulas', async () => {
    await agent.post('/api/transactions').send(tx({ date: '2026-09-20', description: '=HYPERLINK("x")' }));
    const res = await agent.get('/api/transactions/export?from=2026-09-01');
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    const lines = res.text.split('\n');
    expect(lines[0]).toBe('Date,Type,Category,Description,Payment Method,Amount');
    expect(lines[1]).toBe(`2026-09-20,expense,Groceries,"'=HYPERLINK(""x"")",,-12.5`);
    expect(lines).toContain('2026-09-10,income,Freelance,Logo,,250.75');
  });
});

describe('misc', () => {
  it('serves metadata', async () => {
    const res = await request(app).get('/api/meta');
    expect(res.body.categories.income).toContain('Salary');
    expect(res.body.currencies).toContain('JOD');
  });

  it('unknown API routes return 404 JSON', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
  });
});
