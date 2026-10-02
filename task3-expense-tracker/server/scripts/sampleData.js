// Generates ~6 months of realistic demo transactions (deterministic, so every seed looks the same).
export const demoUser = {
  name: 'Demo User',
  email: 'demo@example.com',
  password: 'demo1234',
  currency: 'USD',
};

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const iso = (d) => d.toISOString().slice(0, 10);

export function sampleTransactions(months = 6, today = new Date()) {
  const rand = rng(42);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const amount = (min, max) => Math.round((min + rand() * (max - min)) * 100) / 100;
  const out = [];

  for (let m = months - 1; m >= 0; m -= 1) {
    const y = today.getUTCFullYear();
    const mo = today.getUTCMonth() - m;
    const lastDay = m === 0 ? today.getUTCDate() : new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
    // In the current month, skip anything dated after today; in past months, clamp to the month end.
    const at = (d) => (m === 0 && d > lastDay ? null : iso(new Date(Date.UTC(y, mo, Math.min(d, lastDay)))));

    out.push({ type: 'income', category: 'Salary', amount: 2800, date: at(1), description: 'Monthly salary', paymentMethod: 'Bank Transfer' });
    out.push({ type: 'expense', category: 'Housing & Rent', amount: 850, date: at(2), description: 'Apartment rent', paymentMethod: 'Bank Transfer' });
    out.push({ type: 'expense', category: 'Utilities', amount: amount(70, 140), date: at(5), description: 'Electricity & water', paymentMethod: 'Card' });
    out.push({ type: 'expense', category: 'Subscriptions', amount: 15.99, date: at(8), description: 'Streaming service', paymentMethod: 'Card' });
    out.push({ type: 'expense', category: 'Utilities', amount: 30, date: at(10), description: 'Internet', paymentMethod: 'Card' });
    if (rand() > 0.4) {
      out.push({ type: 'income', category: 'Freelance', amount: amount(150, 700), date: at(12 + Math.floor(rand() * 10)), description: pick(['Website project', 'Logo design', 'Bug fixing gig']), paymentMethod: 'Bank Transfer' });
    }

    for (let i = 0; i < 4; i += 1) {
      out.push({ type: 'expense', category: 'Groceries', amount: amount(35, 110), date: at(3 + i * 7), description: pick(['Supermarket', 'Weekly groceries', 'Market']), paymentMethod: pick(['Card', 'Cash']) });
    }
    const dining = 3 + Math.floor(rand() * 4);
    for (let i = 0; i < dining; i += 1) {
      out.push({ type: 'expense', category: 'Food & Dining', amount: amount(8, 45), date: at(1 + Math.floor(rand() * 28)), description: pick(['Lunch', 'Coffee', 'Dinner out', 'Pizza night']), paymentMethod: pick(['Card', 'Cash', 'Mobile Wallet']) });
    }
    const rides = 4 + Math.floor(rand() * 4);
    for (let i = 0; i < rides; i += 1) {
      out.push({ type: 'expense', category: 'Transport', amount: amount(4, 30), date: at(1 + Math.floor(rand() * 28)), description: pick(['Taxi', 'Fuel', 'Bus card top-up']), paymentMethod: pick(['Cash', 'Card', 'Mobile Wallet']) });
    }
    if (rand() > 0.3) {
      out.push({ type: 'expense', category: pick(['Shopping', 'Entertainment', 'Health', 'Education']), amount: amount(25, 220), date: at(14 + Math.floor(rand() * 14)), description: pick(['Clothes', 'Cinema', 'Pharmacy', 'Online course', 'Headphones']), paymentMethod: 'Card' });
    }
  }
  if (months >= 4) {
    out.push({ type: 'expense', category: 'Travel', amount: 640, date: iso(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 3, 18))), description: 'Weekend trip', paymentMethod: 'Card' });
  }
  return out.filter((t) => t.date);
}
