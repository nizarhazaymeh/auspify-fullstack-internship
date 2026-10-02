import 'dotenv/config';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedDemo } from './seedHelpers.js';
import { demoUser } from './sampleData.js';

try {
  await connectDB();
  const { count } = await seedDemo();
  console.log(`Seeded demo account ${demoUser.email} with ${count} transactions (see README for the password).`);
} catch (err) {
  console.error('Seeding failed:', err.message);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
