# SIMS

"Good inventory management turns sales data into better business decisions."

SIMS has a React/Vite frontend and an Express/PostgreSQL backend.

## Local setup

### Frontend

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` by default.

### Backend

1. Create a PostgreSQL database.
2. Copy `backend/.env.example` to `backend/.env` and replace the sample database URL and JWT secret.
3. Apply every SQL file in `backend/migrations` in numeric order (`001` through `004`).
4. Start the API:

```bash
cd backend
npm install
npm run dev
```

The API runs at `http://localhost:5000` by default.

## Authentication API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create an Admin or Cashier account |
| `POST` | `/api/auth/login` | Authenticate and issue a JWT |
| `GET` | `/api/auth/me` | Return the authenticated user |
| `POST` | `/api/auth/forgot-password` | Create an expiring password reset token |
| `POST` | `/api/auth/reset-password` | Replace a password using a valid reset token |

Password reset tokens expire after `PASSWORD_RESET_TTL_MINUTES` and are stored as SHA-256 hashes. In non-production environments, the forgot-password response includes a `resetUrl` so the flow can be tested locally. Production deliberately does not return the token; connect an email provider before deploying password recovery.

The reset-password endpoint accepts `{ "resetToken", "password", "confirmPassword" }`. Development reset URLs also use the `resetToken` query parameter.

## Dashboard API

All dashboard endpoints require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Roles | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/dashboard` | Admin, Cashier | Return role-specific summary cards and recent sales |
| `GET` | `/api/dashboard/sidebar` | Admin, Cashier | Return role-specific dashboard navigation |
| `GET` | `/api/dashboard/notifications` | Admin, Cashier | Return low-stock and/or completed-sale alerts |
| `GET` | `/api/profile/me` | Admin, Cashier | Return the current user's profile |
| `GET` | `/api/search?q=term` | Admin, Cashier | Search products, sales, and receipts |

Cashier dashboard totals, recent sales, sale search results, receipt search results, sales history, and receipt retrieval are restricted to the authenticated cashier. Admin results cover the business as a whole. Receipt search accepts either a numeric sale ID or a receipt number such as `SIMS-27`.

## Product and inventory API

Product management endpoints require an authenticated Admin token. Products are stored in PostgreSQL through migration `002_create_products.sql`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/products` | List all active and inactive products |
| `GET` | `/api/products/low-stock` | List active products at or below their reorder level |
| `POST` | `/api/products` | Create an active product |
| `PATCH` | `/api/products/:productId` | Update product and inventory details |
| `PATCH` | `/api/products/:productId/status` | Activate or deactivate a product |

The Products and Low Stock React pages consume these endpoints and no longer persist product-management changes in browser storage.

## Sales transaction API

Sales endpoints accept authenticated Admin and Cashier tokens. Sales and their line items are stored through migration `003_create_sales.sql`; migration `004_snapshot_sale_item_names.sql` preserves the sold product name for historical receipts and reports.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/sales/products` | List active products available to the sales cart |
| `GET` | `/api/sales` | List all sales for an Admin or only the authenticated Cashier's sales |
| `GET` | `/api/sales/:saleId` | Retrieve a persisted receipt, with Cashier ownership enforced |
| `POST` | `/api/sales` | Validate and permanently complete a sale |
| `GET` | `/api/reports?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD` | Return Admin-only sales summaries and product/cashier performance |

The create-sale request contains product IDs and quantities only:

```json
{
  "items": [
    { "productId": 3, "quantity": 2 }
  ]
}
```

The server locks the selected product rows, reads their current selling prices, checks active status and stock, calculates line and sale totals in cents, inserts the sale and sale items, and reduces inventory in one PostgreSQL transaction. Any validation, availability, or stock failure rolls the entire transaction back. Checkout, Sales History, receipt reopening, and Reports now read their business data from the authenticated PostgreSQL APIs; local storage is used only for the signed-in session.

## Protecting dashboard APIs

Apply `authenticate` before `authorizeRoles`. Authentication verifies the JWT and attaches the user ID and role; authorization returns `403` when that role is not permitted.

```ts
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";

router.post("/products", authenticate, authorizeRoles("Admin"), createProduct);
router.post("/sales", authenticate, authorizeRoles("Admin", "Cashier"), createSale);
router.get("/reports", authenticate, authorizeRoles("Admin"), getReports);
```

Use `authorizeRoles("Admin")` for administrative inventory and reporting operations. Use `authorizeRoles("Admin", "Cashier")` only for operations intentionally shared by both roles.

## Backend integration tests

Authentication integration tests send real HTTP requests to the Express application and verify the resulting PostgreSQL records. Set a dedicated database in `backend/.env`:

```env
TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/sales_inventory_db_test
TEST_DATABASE_CONNECTION_TIMEOUT_MS=30000
```

The database name must contain `test`. When `TEST_DATABASE_URL` is omitted, the test harness derives `<DATABASE_URL database>_test` and creates it if the PostgreSQL user has permission. The harness never drops a database, but it truncates the SIMS application tables before every test case and after the suite. `TEST_DATABASE_CONNECTION_TIMEOUT_MS` can be increased for hosted databases that cold-start slowly.

```bash
cd backend
npm run test:unit
npm run test:integration
npm test
```

The integration suite covers authentication and password reset, product creation, transactional checkout, role-scoped sale history and receipts, receipt-number search, report aggregation, and Admin-only report authorization.

## Verification

```bash
npm test
npm run build

cd backend
npm test
npm run typecheck
```
