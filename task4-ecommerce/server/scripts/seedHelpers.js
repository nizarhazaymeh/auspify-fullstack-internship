import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Order from '../src/models/Order.js';
import Cart from '../src/models/Cart.js';
import { toCents } from '../src/utils/money.js';
import { slugify } from '../src/utils/slug.js';
import { shippingFor } from '../src/controllers/cartController.js';
import { adminUser, demoCustomer, sampleOrders, sampleProducts } from './sampleData.js';

const FLOW = ['pending', 'processing', 'shipped', 'delivered'];

// Resets the store to the sample catalog, an admin, a demo customer and a few past orders.
export async function seedStore() {
  await Promise.all([User.syncIndexes(), Product.syncIndexes(), Order.syncIndexes(), Cart.syncIndexes()]);
  await Promise.all([Product.deleteMany({}), Order.deleteMany({}), Cart.deleteMany({})]);
  await User.deleteMany({ email: { $in: [adminUser.email, demoCustomer.email] } });

  const [, customer] = await Promise.all([User.create(adminUser), User.create(demoCustomer)]);
  const products = await Product.insertMany(
    sampleProducts.map(({ price, compareAt, ...p }, i) => ({
      ...p,
      slug: slugify(p.name),
      priceCents: toCents(price),
      compareAtCents: compareAt ? toCents(compareAt) : null,
      createdAt: new Date(Date.now() - (sampleProducts.length - i) * 3600000),
    }))
  );

  const orders = sampleOrders.map((o, n) => {
    const items = o.items.map(([idx, qty]) => {
      const p = products[idx];
      return { product: p._id, name: p.name, emoji: p.emoji, image: p.image, priceCents: p.priceCents, qty };
    });
    const subtotalCents = items.reduce((s, i) => s + i.priceCents * i.qty, 0);
    const shippingCents = shippingFor(subtotalCents);
    const createdAt = new Date(Date.now() - o.daysAgo * 86400000);
    const steps = o.status === 'cancelled' ? ['pending', 'cancelled'] : FLOW.slice(0, FLOW.indexOf(o.status) + 1);
    return {
      orderNumber: `ORD-SEED-${String(n + 1).padStart(3, '0')}`,
      user: customer._id,
      items,
      shippingAddress: demoCustomer.address,
      subtotalCents,
      shippingCents,
      totalCents: subtotalCents + shippingCents,
      status: o.status,
      statusHistory: steps.map((s, i) => ({ status: s, by: i === 0 || s === 'cancelled' ? 'customer' : 'admin', at: new Date(createdAt.getTime() + i * 86400000 * 0.8) })),
      createdAt,
      updatedAt: createdAt,
    };
  });
  await Order.insertMany(orders);
  return { products: products.length, orders: orders.length };
}
