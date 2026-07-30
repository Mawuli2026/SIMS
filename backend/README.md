# SIMS Backend

Sales and Inventory Management System — REST API.

**Stack:** Node.js, Express 5, TypeScript, PostgreSQL, JWT auth, bcrypt password hashing.

---

## Table of contents

- [Requirements](#requirements)
- [Project structure](#project-structure)
- [Setup](#setup)
- [Environment variables](#environment-variables)
- [Database migrations](#database-migrations)
- [Running the server](#running-the-server)
- [Authentication](#authentication)
- [Roles](#roles)
- [API reference](#api-reference)
  - [Auth](#auth)
  - [Dashboard](#dashboard)
  - [Profile](#profile)
  - [Search](#search)
- [Error responses](#error-responses)
- [Notes and known gaps](#notes-and-known-gaps)

---

## Requirements

- Node.js 18+ (20+ recommended)
- npm
- PostgreSQL 13+ (local install or a hosted instance)

## Project structure

```
backend/
├── migrations/
│   ├── 001_create_users.sql
│   ├── 002_create_products.sql
│   └── 003_create_sales.sql
├── src/
│   ├── app.ts                     # Express app: middleware, routes, error handling
│   ├── server.ts                  # Entry point: starts HTTP server, handles shutdown
│   ├── config/
│   │   └── db.ts                  # PostgreSQL pool + query helper
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── dashboard.controller.ts
│   │   ├── profile.controller.ts
│   │   └── search.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts     # Verifies JWT, attaches req.authUser
│   │   └── role.middleware.ts     # authorize(...roles) route guard
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── profile.routes.ts
│   │   └── search.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── dashboard.service.ts
│   │   ├── profile.service.ts
│   │   └── search.service.ts
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── dashboard.types.ts
│   │   ├── profile.types.ts
│   │   └── express.d.ts           # Augments Express.Request with authUser
│   └── utils/
│       ├── password.ts            # bcrypt hash/compare
│       ├── token.ts                # JWT sign/verify
│       └── validation.ts          # Zod schemas
├── package.json
└── tsconfig.json
```

## Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (see [Environment variables](#environment-variables) below), then run the migrations against your database (see [Database migrations](#database-migrations)).

## Environment variables

Create `backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# CORS — must match the origin your frontend runs on
CLIENT_URL=http://localhost:5173

# PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/sims
DATABASE_SSL=false          # set to "true" for hosted DBs that require SSL (e.g. Render, Railway, Supabase)

# JWT
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
```

| Variable         | Required | Default                 | Notes                                                                 |
|------------------|----------|--------------------------|------------------------------------------------------------------------|
| `PORT`           | No       | `5000`                   | Port the API listens on                                               |
| `NODE_ENV`       | No       | —                        | `production` switches Morgan to combined log format                   |
| `CLIENT_URL`     | No       | `http://localhost:5173`  | CORS allowed origin                                                    |
| `DATABASE_URL`   | Yes      | —                        | Full PostgreSQL connection string                                      |
| `DATABASE_SSL`   | No       | —                        | Set `true` to enable SSL with `rejectUnauthorized: false`             |
| `JWT_SECRET`     | Yes      | —                        | Must be a real random secret — the app refuses to start token signing/verification if left as the placeholder value |
| `JWT_EXPIRES_IN` | No       | `1d`                     | Any value accepted by `jsonwebtoken`'s `expiresIn` (e.g. `1h`, `7d`)  |

Generate a strong secret if you need one:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Database migrations

Migrations are plain `.sql` files in `migrations/`, applied in order. Run them with `psql`:

```bash
psql "$DATABASE_URL" -f migrations/001_create_users.sql
psql "$DATABASE_URL" -f migrations/002_create_products.sql
psql "$DATABASE_URL" -f migrations/003_create_sales.sql
```

Or, on one line against a local database:

```bash
for f in migrations/*.sql; do psql "$DATABASE_URL" -f "$f"; done
```

**Tables created:**

- **`users`** — `id, first_name, last_name, email (unique), password_hash, role (Admin|Cashier), reset_token, reset_token_expires, created_at, updated_at`
- **`products`** — `id, name, category, cost_price, selling_price, quantity_in_stock, reorder_level, status (active|inactive), created_at, updated_at`
- **`sales`** — `id, cashier_id (FK → users), total_amount, created_at`
- **`sale_items`** — `id, sale_id (FK → sales), product_id (FK → products), quantity, unit_price, line_total` (line-item detail for receipts; not yet exposed by any endpoint)

> `products` and `sales` currently have no CRUD API — they exist so the dashboard/search endpoints below have real data to query. You'll need to insert rows manually (or build the Products/Sales modules next) to see non-empty dashboard results.

## Running the server

```bash
npm run dev      # tsx watch, auto-restarts on file change
npm run build    # compiles to dist/
npm start        # runs the compiled build (dist/server.js)
npm run typecheck
```

Health check:

```bash
curl http://localhost:5000/api/health
```

## Authentication

JWT-based. Every protected route requires:

```
Authorization: Bearer <token>
```

Get a token from `POST /api/auth/login`. The token's `sub` claim is the user ID and it carries a `role` claim (`Admin` or `Cashier`). `auth.middleware.ts` verifies the token and attaches `req.authUser = { id, role }`; anything downstream (controllers, `role.middleware.ts`) reads that instead of re-parsing the token.

Missing/invalid tokens are rejected with `401` before any handler runs.

## Roles

Two roles: **Admin** and **Cashier**.

| Capability                          | Admin | Cashier |
|--------------------------------------|:-----:|:-------:|
| Sidebar: Dashboard, Products, Sales, Sales History, Reports, Low Stock | ✅ | — |
| Sidebar: Record Sales, Sales History | — | ✅ |
| View dashboard summary (own scope)  | ✅ | ✅ |
| View recent sales (all vs. own)     | ✅ (all) | ✅ (own only) |
| View low-stock products             | ✅ | ❌ |
| View reports                        | ✅ | ❌ |
| Record a sale                       | — | ✅ |
| Search products / sales / receipts  | ✅ | ✅ |
| Edit products from search results   | ✅ | ❌ |

`role.middleware.ts` exports `authorize(...roles)`, meant to sit after `authenticate` on any future Admin-only routes, e.g.:

```ts
router.post("/products", authenticate, authorize("Admin"), createProduct);
```

Logout is **not** a backend route in normal use — it's handled by the frontend deleting the stored JWT and redirecting to the login page. (See [Notes and known gaps](#notes-and-known-gaps) for the optional endpoint.)

## API reference

All endpoints below (except `/api/auth/register` and `/api/auth/login`) require the `Authorization: Bearer <token>` header.

### Auth

| Method | Path                 | Access | Description                     |
|--------|----------------------|--------|----------------------------------|
| POST   | `/api/auth/register` | Public | Create a new Admin or Cashier account |
| POST   | `/api/auth/login`    | Public | Authenticate, returns `{ token, user }` |
| GET    | `/api/auth/me`       | Authenticated | Current user's auth profile |

### Dashboard

| Method | Path                            | Access | Description |
|--------|----------------------------------|--------|--------------|
| GET    | `/api/dashboard`                 | Authenticated | Role-specific dashboard summary |
| GET    | `/api/dashboard/sidebar`         | Authenticated | Role-specific sidebar menu items |
| GET    | `/api/dashboard/notifications`   | Authenticated | Role-specific notification bell alerts |

**`GET /api/dashboard` — Admin response:**

```json
{
  "role": "Admin",
  "summary": {
    "todaySales": 1450.00,
    "salesCountToday": 25,
    "totalProducts": 120,
    "lowStockCount": 8
  },
  "recentSales": [
    { "saleId": 101, "cashierName": "Ama Mensah", "totalAmount": 120.00, "createdAt": "2026-07-14T09:20:00.000Z" }
  ],
  "lowStockProducts": [
    { "productId": 5, "name": "Sugar", "quantityInStock": 3, "reorderLevel": 5 }
  ]
}
```

**`GET /api/dashboard` — Cashier response:**

```json
{
  "role": "Cashier",
  "summary": {
    "mySalesToday": 600.00,
    "mySalesCountToday": 10
  },
  "recentSales": [
    { "saleId": 108, "totalAmount": 75.00, "createdAt": "2026-07-14T10:30:00.000Z" }
  ]
}
```

Cashiers never receive `totalProducts`, `lowStockCount`, `lowStockProducts`, or other cashiers' sales.

**`GET /api/dashboard/sidebar`:**

```json
{
  "role": "Admin",
  "menuItems": [
    { "label": "Dashboard", "path": "/dashboard" },
    { "label": "Products", "path": "/products" },
    { "label": "Sales", "path": "/sales" },
    { "label": "Sales History", "path": "/sales-history" },
    { "label": "Reports", "path": "/reports" },
    { "label": "Low Stock", "path": "/low-stock" }
  ]
}
```

**`GET /api/dashboard/notifications`:**

```json
{
  "notifications": [
    { "type": "low_stock", "message": "Sugar is low in stock.", "createdAt": "2026-07-14T08:30:00.000Z" },
    { "type": "sale_completed", "message": "A sale of 120.00 was completed.", "createdAt": "2026-07-14T09:20:00.000Z" }
  ]
}
```

Cashiers only get their own `sale_completed` notifications — never `low_stock` or other inventory alerts.

### Profile

| Method | Path              | Access | Description |
|--------|-------------------|--------|--------------|
| GET    | `/api/profile/me` | Authenticated | Profile dropdown + My Profile page data |

```json
{
  "user": {
    "id": 1,
    "firstName": "Mawuli",
    "lastName": "Ayikpa",
    "fullName": "Mawuli Ayikpa",
    "email": "mawuli@example.com",
    "role": "Admin",
    "dateJoined": "2026-07-14T08:00:00.000Z",
    "initial": "M"
  }
}
```

Never includes `password_hash`, `reset_token`, or `reset_token_expires`.

### Search

| Method | Path                      | Access | Description |
|--------|---------------------------|--------|--------------|
| GET    | `/api/search?q=<term>`    | Authenticated | Search products, sales, and receipts |

```bash
curl -H "Authorization: Bearer <token>" "http://localhost:5000/api/search?q=rice"
```

```json
{
  "query": "rice",
  "results": {
    "products": [
      { "id": 1, "name": "Rice", "sellingPrice": 65.00, "quantityInStock": 20 }
    ],
    "sales": [],
    "receipts": []
  }
}
```

- **Products** — matched by name or category (case-insensitive, partial match), active only.
- **Sales** — matched by sale ID (exact) or cashier name (partial).
- **Receipts** — matched by sale ID (exact only).
- Empty or missing `q` returns `400`.

## Error responses

```json
{ "message": "Authentication token is required." }   // 401 — missing/empty Bearer token
{ "message": "Invalid or expired authentication token." } // 401 — bad/expired token
{ "message": "You do not have permission to access this resource." } // 403 — wrong role
{ "message": "Search query is required." }             // 400 — empty ?q=
{ "message": "Route not found." }                       // 404 — unknown route
{ "message": "Internal server error." }                 // 500 — unhandled error
```

## Notes and known gaps

- **No Products/Sales CRUD API yet.** The `products` and `sales` tables exist (migrations `002` and `003`) so the dashboard and search queries have something to read, but there are no `POST /api/products`, `POST /api/sales`, etc. endpoints yet. `role.middleware.ts` is ready to protect them once built (`authorize("Admin")` / `authorize("Cashier")` per the role table above).
- **Logout endpoint is optional.** `POST /api/auth/logout` is not implemented — the JWT is stateless, so the frontend simply discards the token and redirects to `/login`. Add a blocklist-backed endpoint later if you need server-side session invalidation.
- **`sale_items` is unused for now.** It's in the schema for future itemized receipts but no service currently reads from or writes to it.
