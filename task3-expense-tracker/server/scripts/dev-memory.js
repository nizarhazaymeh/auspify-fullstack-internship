// Runs the API against a throwaway in-memory MongoDB with a seeded demo account.
// Handy for trying the app before setting up MongoDB Atlas. Data is lost on exit.
import 'dotenv/config';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { seedDemo } from './seedHelpers.js';
import { demoUser } from './sampleData.js';

const PORT = process.env.PORT || 5060;
const mongo = await MongoMemoryServer.create();
await connectDB(mongo.getUri('expense_tracker'));
const { count } = await seedDemo();
console.log(`Seeded demo account ${demoUser.email} with ${count} transactions (in-memory, not persisted).`);

const server = app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => {
    server.close();
    await mongo.stop();
    process.exit(0);
  });
}
