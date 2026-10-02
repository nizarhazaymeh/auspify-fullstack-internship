# Task 3 — Expense Tracker Web Application

**Auspify Full Stack Development Internship · Task 3 (Medium)**

A full stack web app to track income and expenses, with dashboards, charts, financial reports and secure user accounts.

## Features
**Authentication**
- Register, log in and log out. Passwords are hashed with bcrypt; sessions use a JWT in an **httpOnly cookie**, so page scripts can't read the token.
- Protected routes on both the API and the frontend, and every query is scoped to the logged-in user, so users can only see their own data.
- Login attempts are rate-limited, and the login error never reveals whether an email is registered.
- Profile settings: name, currency (USD, EUR, GBP, JOD, AED, SAR, EGP, INR), change password, delete account.

**Expense & income management**
- Add, edit and delete transactions: type, amount, category, date, description, payment method.
- Categories are validated against the transaction type (e.g. "Salary" can only be income).
- Amounts are stored as integer cents, so totals never drift (0.1 + 0.2 = 0.30).
- Search, filter by type, category and date range, sort by date or amount, pagination, plus running totals for the current filter.

**Reports & visualization**
- Dashboard: totals, balance, savings rate, a monthly income-vs-expense bar chart, spending by category (doughnut chart), and recent transactions.
- Reports page for any date range: monthly table, category breakdowns, and highlights (largest expense, top category, average daily spending).
- **CSV export** of any filtered list, with spreadsheet formula injection blocked.

**UX:** responsive (sidebar on desktop, bottom tab bar on mobile), dark mode, loading, empty and error states, toasts, confirmation dialogs.

## Tech stack
| Layer | Tech |
|---|---|
| Frontend | React 19, React Router 7, Chart.js (react-chartjs-2), Vite |
| Backend | Node.js, Express 5, express-validator, helmet, express-rate-limit |
| Auth | bcryptjs, jsonwebtoken, httpOnly cookies |
| Database | MongoDB Atlas with Mongoose (aggregation pipelines for reports) |
| Testing | Vitest, Supertest, mongodb-memory-server (24 API tests) |

## Getting started

### 1. MongoDB Atlas
Use the same Atlas cluster as Task 2 (see `task2-student-management/README.md` for setup), but with a different database name:
```bash
cp server/.env.example server/.env
# MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/expense_tracker?retryWrites=true&w=majority
# JWT_SECRET=<paste the output of the command below>
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 2. Run the API
```bash
cd server
npm install
npm run seed     # optional: creates a demo account with ~6 months of transactions
npm run dev      # http://localhost:5060
```
> **No Atlas yet?** `npm run dev:memory` starts the API on a temporary in-memory database, already seeded with the demo account.

**Demo account** (created by `seed` and `dev:memory`): `demo@example.com` / `demo1234`

### 3. Run the frontend
```bash
cd client
npm install
npm run dev      # http://localhost:5175 (proxies /api to :5060)
```

### Tests
```bash
cd server && npm test
```
The tests cover registration and login, cookie and Bearer auth, user data isolation, CRUD, validation, category/type rules, filters, sorting, pagination, exact-cent totals, summary math, empty months and CSV export.

## Production deployment (single server)
In production the API also serves the built React app from the same origin, so no CORS or cross-site cookie setup is needed:
```bash
cd client && npm install && npm run build
cd ../server && npm install
NODE_ENV=production npm start   # set MONGODB_URI and JWT_SECRET in the environment
```
This works on Render, Railway or any Node host. If you host the frontend separately, set `CLIENT_ORIGIN` on the API, set `CROSS_SITE_COOKIES=true`, and point `VITE_API_URL` on the client at the API.

## REST API
All `/api/transactions` routes require authentication (cookie, or `Authorization: Bearer <token>`).

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account (`name`, `email`, `password`, `currency?`) |
| POST | `/api/auth/login` | Log in (`email`, `password`) |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/session` | Current user, or `null` when logged out |
| GET / PATCH / DELETE | `/api/auth/me` | Get, update (`name`, `currency`) or delete your account |
| POST | `/api/auth/change-password` | `currentPassword`, `newPassword` |
| GET | `/api/transactions` | List. Query: `type`, `category`, `from`, `to` (YYYY-MM-DD), `search`, `sort` (`-date`, `amount`, …), `page`, `limit` |
| POST | `/api/transactions` | Create (`type`, `amount`, `category`, `date`, `description?`, `paymentMethod?`) |
| GET / PUT / DELETE | `/api/transactions/:id` | Read, update (partial) or delete |
| GET | `/api/transactions/summary` | Totals, savings rate, by category, monthly trend. Query: `from`, `to` (default: last 6 months) |
| GET | `/api/transactions/export` | CSV download; accepts the same filters as the list |
| GET | `/api/meta` | Categories, currencies and payment methods |

## Project structure
```
task3-expense-tracker/
├── server/src/
│   ├── config/          # db connection, categories & currencies
│   ├── models/          # User (hashed password), Transaction (amount in cents)
│   ├── controllers/     # auth, transactions, summary/report aggregation, CSV
│   ├── middleware/      # auth (JWT cookie), validation, errors
│   └── routes/
└── client/src/
    ├── context/AuthContext.jsx
    ├── components/      # charts, transaction modal & list, summary cards…
    ├── pages/           # Login, Register, Dashboard, Transactions, Reports, Profile
    └── utils/           # money/date formatting, category colors
```

## Screenshots
_Add screenshots of the dashboard, transactions, reports and login pages here for the submission._
