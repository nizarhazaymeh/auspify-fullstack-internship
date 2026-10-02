import Student from '../models/Student.js';
import { matchedData } from 'express-validator';

const FIELDS = [
  'studentId', 'firstName', 'lastName', 'email', 'phone',
  'dateOfBirth', 'gender', 'course', 'year', 'gpa', 'address',
];

// Keep only known fields; empty optional values are stored as null (cleared).
function pickStudent(body) {
  const data = {};
  for (const key of FIELDS) {
    if (body[key] === undefined) continue;
    data[key] = body[key] === '' && ['dateOfBirth', 'gender', 'gpa'].includes(key) ? null : body[key];
  }
  return data;
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function notFound(res) {
  return res.status(404).json({ message: 'Student not found' });
}

// GET /api/students?search=&course=&year=&page=&limit=&sort=
export async function listStudents(req, res) {
  const { search = '', course, year, page = 1, limit = 10, sort = '-createdAt' } = req.query;
  const filter = {};

  if (search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }, { studentId: rx }];
  }
  if (course) filter.course = course;
  if (year) filter.year = Number(year);

  const pageNum = Number(page);
  const limitNum = Number(limit);

  const [items, total] = await Promise.all([
    Student.find(filter)
      .sort(`${sort} _id`)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Student.countDocuments(filter),
  ]);

  res.json({
    data: items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.max(1, Math.ceil(total / limitNum)),
    },
  });
}

// GET /api/students/stats
export async function getStats(req, res) {
  const [summary] = await Student.aggregate([
    {
      $facet: {
        totals: [{ $group: { _id: null, total: { $sum: 1 }, avgGpa: { $avg: '$gpa' } } }],
        byCourse: [{ $group: { _id: '$course', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }],
        byYear: [{ $group: { _id: '$year', count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
      },
    },
  ]);

  const totals = summary.totals[0] ?? { total: 0, avgGpa: null };
  res.json({
    total: totals.total,
    averageGpa: totals.avgGpa == null ? null : Math.round(totals.avgGpa * 100) / 100,
    byCourse: summary.byCourse.map((c) => ({ course: c._id, count: c.count })),
    byYear: summary.byYear.map((y) => ({ year: y._id, count: y.count })),
  });
}

// GET /api/students/:id
export async function getStudent(req, res) {
  const student = await Student.findById(req.params.id);
  if (!student) return notFound(res);
  res.json(student);
}

// POST /api/students
export async function createStudent(req, res) {
  const student = await Student.create(pickStudent(matchedData(req, { locations: ['body'], includeOptionals: true })));
  res.status(201).location(`/api/students/${student.id}`).json(student);
}

// PUT /api/students/:id
export async function updateStudent(req, res) {
  const updates = pickStudent(matchedData(req, { locations: ['body'], includeOptionals: true }));
  const student = await Student.findByIdAndUpdate(req.params.id, updates, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!student) return notFound(res);
  res.json(student);
}

// DELETE /api/students/:id
export async function deleteStudent(req, res) {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) return notFound(res);
  res.json({ message: 'Student deleted', id: student.id });
}
