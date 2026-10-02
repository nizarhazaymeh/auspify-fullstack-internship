// Runs the API against a throwaway in-memory MongoDB with the sample store.
// Handy for trying the app without MongoDB Atlas. Data is lost on exit.
import 'dotenv/config';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { seedStore } from './seedHelpers.js';

const PORT = process.env.PORT || 5070;
const mongo = await MongoMemoryServer.create();
await connectDB(mongo.getUri('ecommerce'));
const { products, orders } = await seedStore();
console.log(`Seeded ${products} products and ${orders} orders (in-memory, not persisted).`);

const server = app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => {
    server.close();
    await mongo.stop();
    process.exit(0);
  });
}
