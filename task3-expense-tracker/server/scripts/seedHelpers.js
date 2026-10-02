import User from '../src/models/User.js';
import Transaction from '../src/models/Transaction.js';
import { toCents } from '../src/utils/money.js';
import { demoUser, sampleTransactions } from './sampleData.js';

export async function seedDemo() {
  await User.syncIndexes();
  await Transaction.syncIndexes();
  const existing = await User.findOne({ email: demoUser.email });
  if (existing) {
    await Transaction.deleteMany({ user: existing._id });
    await existing.deleteOne();
  }
  const user = await User.create(demoUser);
  const docs = sampleTransactions().map(({ amount, date, ...t }) => ({
    ...t,
    user: user._id,
    amountCents: toCents(amount),
    date: new Date(`${date}T00:00:00Z`),
  }));
  await Transaction.insertMany(docs);
  return { user, count: docs.length };
}
