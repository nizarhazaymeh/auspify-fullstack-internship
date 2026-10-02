// Runs the API against a throwaway in-memory MongoDB seeded with sample data.
// Handy for trying the app before setting up MongoDB Atlas. Data is lost on exit.
import 'dotenv/config';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import Student from '../src/models/Student.js';
import { sampleStudents } from './sampleStudents.js';

const PORT = process.env.PORT || 5050;
const mongo = await MongoMemoryServer.create();
await connectDB(mongo.getUri('student_management'));
await Student.syncIndexes();
await Student.insertMany(sampleStudents);
console.log(`Seeded ${sampleStudents.length} sample students (in-memory, not persisted).`);

const server = app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => {
    server.close();
    await mongo.stop();
    process.exit(0);
  });
}
