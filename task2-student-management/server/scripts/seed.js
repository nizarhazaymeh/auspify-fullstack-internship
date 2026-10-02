import 'dotenv/config';
import Student from '../src/models/Student.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { sampleStudents } from './sampleStudents.js';

try {
  await connectDB();
  await Student.deleteMany({});
  await Student.syncIndexes();
  const inserted = await Student.insertMany(sampleStudents);
  console.log(`Seeded ${inserted.length} students.`);
} catch (err) {
  console.error('Seeding failed:', err.message);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
