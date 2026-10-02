import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import Student from '../src/models/Student.js';
import { sampleStudents } from '../scripts/sampleStudents.js';

let mongo;
const app = createApp();

const valid = {
  studentId: 'stu-2001',
  firstName: 'Test',
  lastName: 'Student',
  email: 'Test.Student@Example.com',
  course: 'Computer Science',
  year: 2,
  gpa: 3.5,
};

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Student.syncIndexes();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

beforeEach(async () => {
  await Student.deleteMany({});
});

describe('POST /api/students', () => {
  it('creates a student and normalizes fields', async () => {
    const res = await request(app).post('/api/students').send(valid);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      studentId: 'STU-2001',
      email: 'test.student@example.com',
      fullName: 'Test Student',
      gpa: 3.5,
    });
    expect(res.headers.location).toBe(`/api/students/${res.body.id}`);
  });

  it('rejects missing required fields with field-level errors', async () => {
    const res = await request(app).post('/api/students').send({ firstName: 'Only' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.errors)).toEqual(
      expect.arrayContaining(['studentId', 'lastName', 'email', 'course', 'year'])
    );
  });

  it('rejects invalid email, GPA and year', async () => {
    const res = await request(app)
      .post('/api/students')
      .send({ ...valid, email: 'nope', gpa: 5, year: 9 });
    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('email');
    expect(res.body.errors).toHaveProperty('gpa');
    expect(res.body.errors).toHaveProperty('year');
  });

  it('returns 409 on duplicate email', async () => {
    await request(app).post('/api/students').send(valid);
    const res = await request(app)
      .post('/api/students')
      .send({ ...valid, studentId: 'STU-2002' });
    expect(res.status).toBe(409);
    expect(res.body.errors).toHaveProperty('email');
  });

  it('returns 409 on duplicate student ID', async () => {
    await request(app).post('/api/students').send(valid);
    const res = await request(app)
      .post('/api/students')
      .send({ ...valid, email: 'other@example.com' });
    expect(res.status).toBe(409);
    expect(res.body.errors).toHaveProperty('studentId');
  });

  it('returns 400 on malformed JSON', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Content-Type', 'application/json')
      .send('{"bad json');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/students', () => {
  beforeEach(async () => {
    await Student.insertMany(sampleStudents);
  });

  it('paginates results', async () => {
    const res = await request(app).get('/api/students?page=2&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.pagination).toEqual({ page: 2, limit: 5, total: 15, pages: 3 });
  });

  it('searches by name, email or student ID (case-insensitive, partial)', async () => {
    const byName = await request(app).get('/api/students?search=lin');
    expect(byName.body.data.map((s) => s.firstName)).toEqual(['Lina']);

    const byId = await request(app).get('/api/students?search=stu-1003');
    expect(byId.body.data[0].lastName).toBe('Nasser');
  });

  it('treats regex characters in search literally', async () => {
    const res = await request(app).get('/api/students?search=.*');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('filters by course and year', async () => {
    const res = await request(app).get('/api/students?course=Computer%20Science&year=3');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].firstName).toBe('Omar');
  });

  it('sorts by GPA descending', async () => {
    const res = await request(app).get('/api/students?sort=-gpa&limit=3');
    expect(res.body.data.map((s) => s.gpa)).toEqual([3.95, 3.88, 3.8]);
  });

  it('rejects invalid query params', async () => {
    const res = await request(app).get('/api/students?limit=1000&sort=password');
    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('limit');
    expect(res.body.errors).toHaveProperty('sort');
  });
});

describe('GET /api/students/stats', () => {
  it('returns zeroed stats when empty', async () => {
    const res = await request(app).get('/api/students/stats');
    expect(res.body).toEqual({ total: 0, averageGpa: null, byCourse: [], byYear: [] });
  });

  it('aggregates totals, average GPA and course counts', async () => {
    await Student.insertMany(sampleStudents);
    const res = await request(app).get('/api/students/stats');
    expect(res.body.total).toBe(15);
    expect(res.body.averageGpa).toBeCloseTo(3.38, 2);
    expect(res.body.byCourse[0]).toEqual({ course: 'Computer Science', count: 4 });
  });
});

describe('single student routes', () => {
  let id;
  beforeEach(async () => {
    const res = await request(app).post('/api/students').send(valid);
    id = res.body.id;
  });

  it('GET returns the student', async () => {
    const res = await request(app).get(`/api/students/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.studentId).toBe('STU-2001');
  });

  it('PUT updates only provided fields', async () => {
    const res = await request(app).put(`/api/students/${id}`).send({ gpa: 3.9, phone: '+962 79 555 5555' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ gpa: 3.9, phone: '+962 79 555 5555', firstName: 'Test' });
  });

  it('PUT can clear optional fields', async () => {
    await request(app).put(`/api/students/${id}`).send({ phone: '+962 79 555 5555', gender: 'Male' });
    const res = await request(app).put(`/api/students/${id}`).send({ phone: '', gender: '', gpa: '' });
    expect(res.status).toBe(200);
    expect(res.body.phone).toBe('');
    expect(res.body.gender).toBeNull();
    expect(res.body.gpa).toBeNull();
  });

  it('PUT validates fields', async () => {
    const res = await request(app).put(`/api/students/${id}`).send({ email: 'bad', firstName: '' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('email');
    expect(res.body.errors).toHaveProperty('firstName');
  });

  it('DELETE removes the student', async () => {
    const del = await request(app).delete(`/api/students/${id}`);
    expect(del.status).toBe(200);
    const get = await request(app).get(`/api/students/${id}`);
    expect(get.status).toBe(404);
  });

  it('returns 404 for a valid but unknown id', async () => {
    const unknown = new mongoose.Types.ObjectId().toString();
    for (const method of ['get', 'put', 'delete']) {
      const res = await request(app)[method](`/api/students/${unknown}`).send({ gpa: 3 });
      expect(res.status).toBe(404);
    }
  });

  it('returns 400 for a malformed id', async () => {
    const res = await request(app).get('/api/students/not-an-id');
    expect(res.status).toBe(400);
  });
});

describe('misc', () => {
  it('health check reports db status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toEqual({ status: 'ok', db: 'connected' });
  });

  it('unknown routes return 404 JSON', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/Route not found/);
  });
});
