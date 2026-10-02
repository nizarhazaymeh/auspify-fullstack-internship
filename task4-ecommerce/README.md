# Task 4 — E-Commerce Website

**Auspify Full Stack Development Internship · Task 4 (Medium)**

A full stack online store with a product catalog, shopping cart, customer accounts, checkout, order tracking and an admin dashboard for managing products and orders.

## Features
**Storefront**
- Home page with categories, featured products and promotions.
- Catalog with search, category filter (with live counts), price range, in-stock filter, sorting and pagination.
- Product pages with sale pricing, stock status, a quantity selector, "Buy now" and related products.

**Shopping cart**
- Guests can add to a cart that's saved in the browser. On login it's **merged into the account's server-side cart**, so it follows the customer across devices.
- Live totals, flat shipping ($5) with **free shipping over $50**, and a progress bar toward free shipping.
- The cart adjusts automatically when a product sells out, its stock drops or it's hidden, and tells the customer what changed.

**Checkout & orders**
- Shipping address form (pre-filled from the saved address), an optional delivery note, and **cash on delivery**. No card details are collected.
- **Prices always come from the database**: the browser never decides what an order costs.
- **No overselling**: stock is reserved with atomic conditional updates, so two shoppers can't buy the last unit. If any item fails, earlier reservations are rolled back.
- Order history and order pages with a status timeline. Customers can cancel while an order is still pending, and the stock is returned.

**User accounts**
- Register and log in with JWT httpOnly cookies and bcrypt-hashed passwords. Login is rate-limited.
- **Roles**: every sign-up is a customer, and admin rights can't be requested through the API.
- Account page: name, default shipping address, change password.

**Admin dashboard** (`/admin`)
- KPIs (revenue, orders, average order value, products, customers), a 30-day revenue chart, orders by status, low-stock alerts, best sellers and recent orders.
- Product management: create, edit, delete, show/hide, featured flag, sale price, stock, image URL or emoji, with a live preview.
- Order management: search by order number or customer, filter by status, view details, and move orders through **pending → processing → shipped → delivered** (or cancel, which restocks). Invalid transitions are rejected.

**UX:** responsive (cards on mobile), dark mode, loading, empty and error states, toasts, confirmation dialogs, accessible forms.

## Tech stack
| Layer | Tech |
|---|---|
| Frontend | React 19, React Router 7, Vite, plain CSS |
| Backend | Node.js, Express 5, express-validator, helmet, express-rate-limit |
| Auth | bcryptjs, jsonwebtoken (httpOnly cookie), role-based access |
| Database | MongoDB Atlas with Mongoose (aggregations for stats) |
| Testing | Vitest, Supertest, mongodb-memory-server (21 API tests) |

## Getting started

### 1. Configure the API
```bash
cp server/.env.example server/.env
# MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/ecommerce?retryWrites=true&w=majority
# JWT_SECRET=<output of the command below>
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 2. Run the API
```bash
cd server
npm install
npm run seed     # resets the store: 24 products, sample orders, admin + demo customer
npm run dev      # http://localhost:5070
```
> **No Atlas?** `npm run dev:memory` runs the API on a temporary in-memory database with the same sample data.

**Demo accounts** (created by `seed` / `dev:memory`):
| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `admin1234` |
| Customer | `demo@example.com` | `demo1234` |

### 3. Run the storefront
```bash
cd client
npm install
npm run dev      # http://localhost:5176 (proxies /api to :5070)
```

### Tests
```bash
cd server && npm test
```
The tests cover role restrictions, catalog filters and counts, product admin and slugs, cart rules and merging, price changes between cart and checkout, the race for the last unit with rollback, order isolation between customers, cancellation and restocking, status transitions, and dashboard stats.

## Production
`NODE_ENV=production npm start` in `server/` also serves the built client (`cd client && npm run build`) from the same origin. Set `MONGODB_URI` and `JWT_SECRET` in the environment.

## REST API
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` · `/login` · `/logout` | public | Account & session |
| GET | `/api/auth/session` | public | Current user or `null` |
| GET / PATCH | `/api/auth/me` | user | Profile (`name`, `address`) |
| POST | `/api/auth/change-password` | user | `currentPassword`, `newPassword` |
| GET | `/api/products` | public | `search`, `category`, `minPrice`, `maxPrice`, `inStock`, `featured`, `sort` (`newest`, `price-asc`, `price-desc`, `name`, `stock`), `page`, `limit` |
| GET | `/api/products/:idOrSlug` | public | Product + related products |
| POST / PUT / DELETE | `/api/products[/:id]` | admin | Manage products |
| GET / DELETE | `/api/cart` | user | View / clear cart |
| POST | `/api/cart/items` | user | Add `{ productId, qty }` |
| PUT / DELETE | `/api/cart/items/:productId` | user | Set quantity / remove |
| POST | `/api/cart/merge` | user | Merge a guest cart `{ items: [{ productId, qty }] }` |
| POST | `/api/orders` | user | Checkout from the cart `{ shippingAddress, note?, saveAddress? }` |
| GET | `/api/orders` · `/api/orders/:id` | user | Own orders (admins can open any) |
| POST | `/api/orders/:id/cancel` | user | Cancel a pending order |
| GET | `/api/admin/stats` | admin | Dashboard numbers |
| GET | `/api/admin/orders` | admin | All orders: `status`, `search`, `page` |
| PATCH | `/api/admin/orders/:id/status` | admin | `{ status }`, following the allowed flow |

## Project structure
```
task4-ecommerce/
├── server/src/
│   ├── config/store.js        # categories, statuses & allowed transitions, shipping rules
│   ├── models/                # User (role, address), Product, Cart, Order (item snapshots)
│   ├── controllers/           # auth, products, cart, orders + admin stats
│   ├── middleware/            # auth (requireAuth / requireAdmin / optionalAuth), validation, errors
│   └── routes/
└── client/src/
    ├── context/               # AuthContext, CartContext (guest ⇄ server cart)
    ├── components/            # header, product card/image, stepper, timeline…
    └── pages/                 # Home, Shop, Product, Cart, Checkout, Orders, Account, admin/*
```

## Screenshots
_Add screenshots of the home page, catalog, product page, cart, checkout, order tracking and admin dashboard here for the submission._
