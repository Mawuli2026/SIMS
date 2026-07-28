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
3. Apply `backend/migrations/001_create_users.sql` to the database.
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

The database name must contain `test`. When `TEST_DATABASE_URL` is omitted, the test harness derives `<DATABASE_URL database>_test` and creates it if the PostgreSQL user has permission. The harness never drops a database, but it truncates the `users` table before every test case and after the suite. `TEST_DATABASE_CONNECTION_TIMEOUT_MS` can be increased for hosted databases that cold-start slowly.

```bash
cd backend
npm run test:unit
npm run test:integration
npm test
```

The integration suite covers registration validation and persistence, duplicate emails, bcrypt hashes, successful and rejected logins, JWT-protected `/me`, password-reset token hashing and expiry, password changes, and one-time token enforcement.

## Verification

```bash
npm test
npm run build

cd backend
npm test
npm run typecheck
```
