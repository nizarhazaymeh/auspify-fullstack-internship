# Task 2 — Student Management System

**Auspify Full Stack Development Internship · Task 2 (Easy)**

A full stack application for managing student records: add, view, update and delete students, with search, filters, sorting and pagination.

## Features
- **Add students** — validated form (client and server side), with clear field-level error messages
- **Update records** — edit any field; optional fields can be cleared
- **Delete records** — confirmation dialog before deleting
- **View student details** — profile page with all information, including age and timestamps
- **Search** by name, email or student ID (partial, case-insensitive, debounced)
- **Filter** by course and year; **sort** by name, ID, GPA or date added; **pagination**
- **Dashboard stats** — total students, average GPA, number of courses, largest course
- Duplicate email / student ID detection (HTTP 409, shown next to the field)
- Responsive: the table becomes cards on mobile; supports a dark theme
- Loading, empty and error states (e.g. when the API is down)

## Tech stack
| Layer | Tech |
|---|---|
| Frontend | React 19, React Router 7, Vite, plain CSS |
| Backend | Node.js, Express 5, express-validator |
| Database | MongoDB Atlas with Mongoose |
| Testing | Vitest, Supertest, mongodb-memory-server |

## Project structure
```
task2-student-management/
├── server/
│   ├── src/
│   │   ├── config/db.js             # MongoDB connection
│   │   ├── models/Student.js        # Mongoose schema
│   │   ├── controllers/             # request handlers (CRUD, stats)
│   │   ├── routes/students.js       # REST routes
│   │   ├── middleware/              # validation + error handling
│   │   ├── app.js                   # Express app
│   │   └── server.js                # entry point
│   ├── scripts/                     # seed data, in-memory dev server
│   └── tests/students.test.js       # API tests
└── client/
    └── src/
        ├── api/students.js          # fetch wrapper
        ├── components/              # form, modal, toasts, pagination…
        ├── pages/                   # list, details, add, edit
        └── styles/app.css
```

## Getting started

### 1. Set up MongoDB Atlas (free)
1. Sign up at <https://www.mongodb.com/cloud/atlas/register> and create a free **M0** cluster.
2. **Database Access** → *Add New Database User* → choose a username and password.
3. **Network Access** → *Add IP Address* → *Add Current IP Address* (or `0.0.0.0/0` for anywhere).
4. **Clusters** → *Connect* → *Drivers* → copy the connection string.
5. Create `server/.env` from the example and paste the string in, adding the database name `student_management`:
   ```bash
   cp server/.env.example server/.env
   # MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/student_management?retryWrites=true&w=majority
   ```

### 2. Run the API
```bash
cd server
npm install
npm run seed     # optional: load 15 sample students
npm run dev      # http://localhost:5050
```

> **No Atlas yet?** `npm run dev:memory` starts the API on a temporary in-memory MongoDB with sample data (nothing is saved).

### 3. Run the frontend
```bash
cd client
npm install
npm run dev      # http://localhost:5174 (proxies /api to :5050)
```

### Tests
```bash
cd server
npm test
```
23 API tests cover every endpoint, plus validation errors, duplicates, 404s, search, filters, sorting and pagination. They run against an in-memory MongoDB, so Atlas isn't needed.

## REST API
Base URL: `/api/students`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List students. Query: `search`, `course`, `year`, `sort` (`firstName`, `-gpa`, …), `page`, `limit` (≤100) |
| GET | `/stats` | Total, average GPA, counts by course and by year |
| GET | `/meta` | Allowed courses and genders |
| GET | `/:id` | Get one student |
| POST | `/` | Create a student |
| PUT | `/:id` | Update a student (partial updates allowed) |
| DELETE | `/:id` | Delete a student |

`GET /api/health` reports API and database status.

**Student fields:** `studentId`*, `firstName`*, `lastName`*, `email`*, `course`*, `year`* (1–5), `phone`, `dateOfBirth`, `gender`, `gpa` (0–4), `address` (* = required)

**Example**
```bash
curl -X POST http://localhost:5050/api/students \
  -H "Content-Type: application/json" \
  -d '{"studentId":"STU-2001","firstName":"Sara","lastName":"Ali","email":"sara@example.com","course":"Computer Science","year":2,"gpa":3.6}'
```

**Error responses** are JSON with a `message` and, for validation errors, an `errors` object keyed by field:
`400` invalid input · `404` not found · `409` duplicate email or student ID · `500` server error

## Screenshots
_Add screenshots of the list, details, add/edit form and delete dialog here for the submission._
