import 'dotenv/config';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedStore } from './seedHelpers.js';

try {
  await connectDB();
  const { products, orders } = await seedStore();
  console.log(`Seeded ${products} products, ${orders} orders, plus admin and demo customer accounts (see README).`);
} catch (err) {
  console.error('Seeding failed:', err.message);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
