# SIMS

"Good inventory management turns sales data into better business decisions."

SIMS has a React/Vite frontend and an Express/PostgreSQL backend.

Role-based operating instructions for SystemAdmin, Manager, and Cashier are available in [USER_GUIDE.md](USER_GUIDE.md), with a formatted Word edition in [SIMS_User_Guide_v1.1.docx](SIMS_User_Guide_v1.1.docx).

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
3. Apply every SQL file in `backend/migrations` in numeric order (`001` through `010`) by running `cd backend` followed by `npm run migrate`. The command records completed files in `schema_migrations`, skips them on later runs, and safely brings an existing SIMS database forward.
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
| `POST` | `/api/auth/login` | Authenticate and issue a JWT |
| `GET` | `/api/auth/me` | Return the authenticated user |
| `POST` | `/api/auth/change-password` | Change the authenticated user's password and return a rotated JWT |
| `POST` | `/api/auth/forgot-password` | Create an expiring password reset token |
| `POST` | `/api/auth/reset-password` | Replace a password using a valid reset token |

Password reset tokens expire after `PASSWORD_RESET_TTL_MINUTES` and are stored as SHA-256 hashes. When SMTP is configured, SIMS sends a text-and-HTML recovery email containing the one-use reset link. Without SMTP, non-production environments include a `resetUrl` in the response so the flow can still be tested locally. Production never returns the token or reset URL and refuses to start without email configuration.

### Password-recovery email configuration

SIMS uses a reusable Nodemailer SMTP transport, so it can work with any provider that supplies SMTP credentials. Add these values to `backend/.env`:

```env
CLIENT_URL=https://your-frontend.example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
EMAIL_FROM=SIMS <no-reply@your-domain.example>
PASSWORD_RESET_TTL_MINUTES=30
```

Use `SMTP_SECURE=true` for implicit TLS, normally on port 465. For port 587, use `SMTP_SECURE=false`; Nodemailer upgrades the connection with STARTTLS when the server supports it. `SMTP_USER` and `SMTP_PASSWORD` must either both be provided or both be omitted for a trusted local relay. `CLIENT_URL` must be the public frontend origin because it is used to construct `/reset-password?resetToken=...` links.

To verify delivery after deployment, request a reset for a test employee through `/forgot-password`, confirm that the message arrives, open the link, set a new password, and confirm the link cannot be reused. Email delivery failures are logged on the backend without logging the recipient or token, while the API keeps the same generic response to prevent account discovery.

### Login rate limiting and account lockout

`POST /api/auth/login` has a bounded in-memory fixed-window limiter per client IP. PostgreSQL independently tracks failed attempts per known account through migration `009_add_login_lockout.sql`. By default, five failed attempts within 15 minutes lock the account for 15 minutes. A successful login, completed password recovery, password change, SystemAdmin temporary-password reset, or SystemAdmin **Unlock** action clears the account lock.

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `LOGIN_MAX_FAILED_ATTEMPTS` | `5` | Failed attempts needed to lock a known account |
| `LOGIN_FAILED_ATTEMPT_WINDOW_MINUTES` | `15` | Rolling period for account failures |
| `LOGIN_LOCKOUT_MINUTES` | `15` | Automatic account-lock duration |
| `LOGIN_RATE_LIMIT_MAX` | `20` | Login requests allowed per client IP and fixed window |
| `LOGIN_RATE_LIMIT_WINDOW_MINUTES` | `15` | IP limiter window |
| `TRUST_PROXY_HOPS` | `0` | Number of trusted reverse-proxy hops used to determine the client IP |

Keep `TRUST_PROXY_HOPS=0` when the API is directly exposed. Set the exact trusted hop count when deploying behind a known reverse proxy; do not enable broad proxy trust. The in-memory IP limiter is appropriate for this single-instance lite deployment. A multi-instance deployment should replace its store with a shared Redis or database-backed limiter.

SIMS uses `SystemAdmin`, `Manager`, and `Cashier` roles. Migration `005_expand_employee_roles.sql` converts legacy `Admin` accounts to `Manager`. Public registration is disabled: `/api/auth/register` does not exist, `/register` redirects to login, and employee accounts are created through the protected SystemAdmin Employee Management page.

## First SystemAdmin bootstrap

Apply migration `005` before running the bootstrap. The command takes a PostgreSQL transaction lock, refuses to run when any SystemAdmin already exists, refuses to reuse an employee email, and stores only a bcrypt password hash.

Set the bootstrap values as temporary process environment variables rather than saving the password in `.env`:

```powershell
cd backend
$env:BOOTSTRAP_SYSTEM_ADMIN_FIRST_NAME="Alicia"
$env:BOOTSTRAP_SYSTEM_ADMIN_LAST_NAME="Ng"
$env:BOOTSTRAP_SYSTEM_ADMIN_EMAIL="system-admin@example.com"
$env:BOOTSTRAP_SYSTEM_ADMIN_PASSWORD="use-a-unique-12-character-or-longer-password"
npm run bootstrap:system-admin
Remove-Item Env:BOOTSTRAP_SYSTEM_ADMIN_FIRST_NAME
Remove-Item Env:BOOTSTRAP_SYSTEM_ADMIN_LAST_NAME
Remove-Item Env:BOOTSTRAP_SYSTEM_ADMIN_EMAIL
Remove-Item Env:BOOTSTRAP_SYSTEM_ADMIN_PASSWORD
```

The command prints only the created email address and never prints the password. A second run exits with an error. After bootstrap, use the protected Employee Management page to create Manager and Cashier accounts; additional SystemAdmin accounts cannot be created through that page or its API.

The reset-password endpoint accepts `{ "resetToken", "password", "confirmPassword" }`. Development reset URLs also use the `resetToken` query parameter.

## Dashboard API

All dashboard endpoints require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Roles | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/dashboard` | SystemAdmin, Manager, Cashier | Return role-specific summary cards and recent sales |
| `GET` | `/api/dashboard/sidebar` | SystemAdmin, Manager, Cashier | Return role-specific dashboard navigation |
| `GET` | `/api/dashboard/notifications` | SystemAdmin, Manager, Cashier | Return low-stock and/or completed-sale alerts |
| `GET` | `/api/profile/me` | SystemAdmin, Manager, Cashier | Return the current user's profile |
| `GET` | `/api/search?q=term` | SystemAdmin, Manager, Cashier | Search products, sales, and receipts |

Cashier dashboard totals, recent sales, sale search results, receipt search results, sales history, and receipt retrieval are restricted to the authenticated cashier. Manager and SystemAdmin results cover the business as a whole. Receipt search accepts either a numeric sale ID or a receipt number such as `SIMS-27`.

## Employee Management API

Migration `006_add_employee_account_management.sql` adds employee account status, creator tracking, and last-login tracking. Migration `007_require_employee_password_change.sql` tracks whether an employee must replace a temporary password. Migration `008_add_token_version.sql` provides database-backed session revocation. Migration `009_add_login_lockout.sql` stores failed-login and temporary-lock state. All employee endpoints require a valid `SystemAdmin` token; Manager and Cashier requests receive `403`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/employees?q=&role=&status=` | Search and filter employee accounts |
| `POST` | `/api/employees` | Create an active Manager or Cashier with a temporary password |
| `PATCH` | `/api/employees/:employeeId/role` | Change an employee between Manager and Cashier |
| `PATCH` | `/api/employees/:employeeId/status` | Enable or disable an employee account |
| `PATCH` | `/api/employees/:employeeId/password` | Set a replacement temporary password and require another first-login change |
| `PATCH` | `/api/employees/:employeeId/revoke-sessions` | Immediately invalidate all JWTs issued to an employee |
| `PATCH` | `/api/employees/:employeeId/unlock` | Clear a temporary login lock and failed-attempt counter |

The React Employee Management page is available at `/dashboard/employees` to SystemAdmin users. It supports search, role/status filters, employee creation, temporary-password resets, force logout, account unlocking, role changes, and enable/disable actions. Employee deletion is intentionally not supported, SystemAdmin accounts cannot be changed through these endpoints, and a SystemAdmin cannot disable their own account.

Disabling an account blocks its next authenticated request and future login immediately. It also rotates the employee's token version, so old sessions stay revoked if the account is later enabled. The authentication middleware reloads the current role, account status, and token version from PostgreSQL for every protected request, so role and security changes take effect without waiting for an existing JWT to expire.

New Manager and Cashier accounts are created with `must_change_password = TRUE`. They can log in and call `/api/auth/me` and `/api/auth/change-password`, but all dashboard and business APIs return `403` with code `PASSWORD_CHANGE_REQUIRED` until the temporary password is replaced. The change-password endpoint verifies the current password, requires a different password of at least 12 characters, clears reset tokens, and removes the requirement. Email password recovery also removes the requirement because the user chooses a private replacement password.

Migration 007 defaults existing accounts and the bootstrapped SystemAdmin to `must_change_password = FALSE`, avoiding an unexpected lockout during deployment. To force an existing Manager or Cashier through the new process, use **Reset password** on the Employee Management page. The profile menu also provides voluntary password changing for every signed-in user.

Every JWT issued after migration 008 contains a `ver` claim matching the user's `token_version`. Password changes, email password recovery, SystemAdmin temporary-password resets, account disabling, and **Force logout** increment that database version. Older JWTs then receive `401`, while a successful self-service password change returns a fresh versioned token for the current device. JWTs issued before this feature do not contain `ver` and will require one new login after deployment.

## Audit Logs API

Migration `010_create_audit_logs.sql` adds an append-only operational audit trail. SIMS records successful and failed authentication events, password recovery and changes, employee administration, product mutations, and completed sales. Entries include the authenticated actor when available, target record, outcome, request IP, user agent, timestamp, and a small non-secret details object. Passwords, temporary passwords, JWTs, and password-reset tokens are never stored in audit details.

| Method | Endpoint | Role | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/audit-logs?q=&action=&outcome=&fromDate=&toDate=` | SystemAdmin | Search and filter the latest 200 audit events |

The protected viewer is available at `/dashboard/audit-logs` only to SystemAdmin users. Manager and Cashier tokens receive `403`; anonymous requests receive `401`. Audit insertion is best-effort so an audit storage fault cannot falsely turn an already-completed sale or account mutation into a failed API response. Backend errors still report an audit-storage failure for operations monitoring.

## Product and inventory API

Product management endpoints require an authenticated Manager or SystemAdmin token. Products are stored in PostgreSQL through migration `002_create_products.sql`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/products?page=1&pageSize=20&q=` | Search and paginate active and inactive products |
| `GET` | `/api/products/low-stock?page=1&pageSize=20&q=` | Search and paginate products at or below their reorder level |
| `POST` | `/api/products` | Create an active product |
| `PATCH` | `/api/products/:productId` | Update product and inventory details |
| `PATCH` | `/api/products/:productId/status` | Activate or deactivate a product |

The Products and Low Stock React pages consume these endpoints and no longer persist product-management changes in browser storage.

## Sales transaction API

Sales endpoints accept authenticated SystemAdmin, Manager, and Cashier tokens. Sales and their line items are stored through migration `003_create_sales.sql`; migration `004_snapshot_sale_item_names.sql` preserves the sold product name for historical receipts and reports.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/sales/products` | List active products available to the sales cart |
| `GET` | `/api/sales?page=1&pageSize=20&q=&date=YYYY-MM-DD` | Search and paginate role-scoped sales with filtered summary totals |
| `GET` | `/api/sales/:saleId` | Retrieve a persisted receipt, with Cashier ownership enforced |
| `POST` | `/api/sales` | Validate and permanently complete a sale |
| `GET` | `/api/reports?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD` | Return Manager/SystemAdmin sales summaries and product/cashier performance |

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

Apply `authenticate` before `authorizeRoles`. Authentication verifies the JWT, confirms that the user still exists and is active, and attaches the current database role. Authorization returns `403` when that role is not permitted.

```ts
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";

router.post("/products", authenticate, authorizeRoles("SystemAdmin", "Manager"), createProduct);
router.post("/sales", authenticate, authorizeRoles("SystemAdmin", "Manager", "Cashier"), createSale);
router.get("/reports", authenticate, authorizeRoles("SystemAdmin", "Manager"), getReports);
employeeRouter.use(authenticate, authorizeRoles("SystemAdmin"));
```

Use `authorizeRoles("SystemAdmin", "Manager")` for inventory and reporting operations. Add `Cashier` only for operations intentionally shared with checkout staff.

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

The integration suite covers disabled public registration, one-time SystemAdmin bootstrap, authentication, login lockout and administrator unlocking, forced and voluntary password changes, password recovery, database-backed token revocation, protected employee creation and account management, immediate disabled-account enforcement, audit persistence and secret exclusion, the complete SystemAdmin/Manager/Cashier endpoint authorization matrix, product creation, transactional checkout, role-scoped sale history and receipts, receipt-number search, report aggregation, and management-only report authorization.

## Verification

```bash
npm test
npm run build

cd backend
npm test
npm run typecheck
```

## Performance and traffic

SIMS serves deterministic WebP versions of the authentication background and logo, while retaining the original PNG files as compatibility fallbacks. Recreate the optimized assets after changing either source image with:

```bash
npm run optimize:images
```

The Products and Sales History APIs default to 20 records per page and cap `pageSize` at 100. Search and sale-date filters execute in PostgreSQL before pagination, so the UI does not download the entire inventory or transaction history. Express compresses responses larger than 512 bytes and marks API responses `Cache-Control: no-store` to prevent authenticated business data from being cached by shared proxies.

For the existing Render Static Site, add this custom header in **Settings > Headers** so Vite's hashed `/assets/*` files can be reused without revalidation:

| Path | Header | Value |
| --- | --- | --- |
| `/assets/*` | `Cache-Control` | `public, max-age=31536000, immutable` |

Do not apply that immutable rule to `/index.html`, because the HTML file points to the newest hashed JavaScript and CSS after every deployment.

Run a bounded read-only load test against a local backend health endpoint with:

```bash
cd backend
npm run load:test
```

Override the defaults in PowerShell when testing a protected read endpoint:

```powershell
$env:LOAD_TEST_URL="http://localhost:5000/api/dashboard"
$env:LOAD_TEST_REQUESTS="50"
$env:LOAD_TEST_CONCURRENCY="5"
$env:LOAD_TEST_TOKEN="your-short-lived-test-token"
npm run load:test
Remove-Item Env:LOAD_TEST_URL, Env:LOAD_TEST_REQUESTS, Env:LOAD_TEST_CONCURRENCY, Env:LOAD_TEST_TOKEN
```

The script allows only `GET` traffic, caps the run at 500 requests and concurrency at 50, and reports status counts, throughput, received response-body bytes, and minimum/median/p95/maximum latency. Use a dedicated test account and avoid load-testing production during business hours.
