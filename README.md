# SIMS

"Good inventory management turns sales data into better business decisions."

SIMS has a React/Vite frontend and an Express/PostgreSQL backend.

## User guide

### Purpose of SIMS

The Sales and Inventory Management System (SIMS) helps a small supermarket or provisions shop manage employee access, products, inventory, sales, receipts, reports, and security records from one application.

SIMS has three user roles:

- **SystemAdmin** manages employees and security in addition to performing management work.
- **Manager** manages inventory, sales, and reports.
- **Cashier** records sales and reviews only the transactions completed under their account.

Public account registration is not available. The first SystemAdmin is created during system setup, and that SystemAdmin creates Manager and Cashier accounts.

### Role permissions

| Function | SystemAdmin | Manager | Cashier |
| --- | --- | --- | --- |
| View personal dashboard | Yes | Yes | Yes |
| View business-wide sales summaries | Yes | Yes | No |
| Manage employees | Yes | No | No |
| View audit logs | Yes | No | No |
| Add, edit, activate, or deactivate products | Yes | Yes | No |
| View low-stock products | Yes | Yes | No |
| Record a sale | Yes | Yes | Yes |
| View all employees' sales and receipts | Yes | Yes | No |
| View own sales and receipts | Yes | Yes | Yes |
| View sales reports | Yes | Yes | No |
| Change own password and view own profile | Yes | Yes | Yes |

### Signing in and account security

#### Sign in

1. Open the SIMS web address supplied by the system owner. For local use, this is normally `http://localhost:5173/login`. Sims website:https://sims-h7s2.onrender.com
2. Enter your employee email address and password.
3. Select **Log in**.
4. SIMS opens the dashboard permitted for your role.

There is no public **Create Account** link. Contact the SystemAdmin if you need an employee account.

#### First login with a temporary password

1. Sign in using the email and temporary password supplied by the SystemAdmin.
2. SIMS redirects you to **Change Password**.
3. Enter the temporary password as the current password.
4. Enter and confirm a private new password of at least 12 characters.
5. Submit the form. SIMS signs the current device into a new secured session.

Dashboard and business pages remain unavailable until this change is completed. Do not continue using or share the temporary password.

#### Change your password later

1. Select your profile icon in the upper-right corner.
2. Select **Change Password**.
3. Enter your current password.
4. Enter and confirm a different new password of at least 12 characters.
5. Submit the form.

Changing a password invalidates previously issued sessions. The current device receives a replacement session; other devices must sign in again.

#### Recover a forgotten password

1. On the login page, select **Forgot password?**
2. Enter the email address registered on your SIMS account.
3. Submit the request.
4. Check the inbox and spam folder for **Reset your SIMS password**.
5. Open the recovery link and enter a new password.

The recovery link normally expires after 30 minutes and works only once. Contact the SystemAdmin if the registered email is incorrect or no message arrives.

#### Failed logins, disabled accounts, and revoked sessions

- Five failed login attempts within 15 minutes normally lock an account for 15 minutes.
- Wait for the lock to expire, use password recovery, or ask the SystemAdmin to select **Unlock**.
- A disabled employee cannot sign in. Only the SystemAdmin can enable the account.
- If the SystemAdmin uses **Force logout**, the employee must sign in again on every device.
- A `401` message normally means the session expired or was revoked. Return to the login page and sign in again.
- A `403` message means the signed-in role cannot use that function.

Select the profile icon to open **My Profile**, change your password, or log out. Always log out after using SIMS on a shared computer.

### Shared dashboard features

- Use the sidebar to open the pages available to your role.
- Use the menu button to collapse or expand the sidebar.
- Select the notification button to view recent sales or low-stock alerts permitted for your role.
- Use the top search box to find products, sales, or receipt numbers.
- Cashier search results are restricted to transactions completed under the signed-in Cashier account.

### SystemAdmin guide

The SystemAdmin has all Manager capabilities plus employee administration and audit-log access.

#### Create an employee

1. Open **Employees**.
2. Select **+ Add Employee**.
3. Enter the employee's first name, last name, and real email address.
4. Select **Manager** or **Cashier**.
5. Enter and confirm a temporary password of at least 12 characters.
6. Select **Create Employee**.
7. Give the temporary password to the employee securely and instruct them to replace it at first login.

Email addresses must be unique. Employee Management cannot create another SystemAdmin.

#### Manage employees

The Employee page allows the SystemAdmin to:

- Search employees by name or email.
- Filter employees by role or account status.
- Change an employee between Manager and Cashier.
- Disable an account to reject future logins and existing sessions.
- Enable an account and require the employee to sign in again.
- Set a replacement temporary password.
- Select **Force logout** to invalidate every current employee session.
- Select **Unlock** after confirming the identity of a temporarily locked employee.

Employee accounts are retained instead of deleted so historical sales preserve the correct Cashier information. The protected SystemAdmin account cannot be disabled or reassigned through Employee Management.

#### Audit logs

Open **Audit Logs** to review authentication outcomes, password actions, employee administration, product changes, and completed sales. Logs can be filtered by search text, action, outcome, and date. Passwords, JWTs, temporary passwords, and reset tokens are not stored in audit details.

### Manager guide

The Manager dashboard provides business-wide sales and inventory summaries without employee-management or audit-log access.

#### Add a product

1. Open **Products**.
2. Select **+ Add Product**.
3. Enter the product name and category.
4. Enter the cost price and selling price.
5. Enter the current stock quantity and reorder level.
6. Select **Save Product**.

#### Edit, activate, or deactivate a product

1. Find the product and select **Edit**.
2. Correct its details, pricing, stock, or reorder information.
3. Select **Save Changes**.

Select **Deactivate** to remove a product from new sales without deleting it. Select **Activate** to make it available again. Completed receipts retain the product name and selling price recorded at the time of sale.

#### Low stock and reports

- Open **Low Stock** to see active products whose stock quantity is at or below their reorder level.
- Open **Reports** to view revenue, transactions, items sold, average sale value, product performance, and Cashier performance.
- Use **From** and **To** to report on a date range, or select **All Time** to remove the range.

### Recording sales - all roles

SystemAdmin, Manager, and Cashier can record sales.

1. Open **Sales** or **Record Sales**.
2. Select an active product.
3. Enter a quantity no greater than the available stock.
4. Select **Add to Sale**.
5. Repeat for other products.
6. Review the unit prices, quantities, line totals, and overall total.
7. Correct or remove items when necessary.
8. Select **Complete Sale** after confirming the cart with the customer.

SIMS validates current prices and stock in PostgreSQL, saves the sale, and reduces inventory in one transaction. If a product is unavailable or has insufficient stock, the complete operation is rejected without partially reducing inventory.

#### Print and issue a receipt

After checkout, review the receipt number, date, Cashier, products, prices, quantities, and total. Select **Print Receipt** to open the browser's print dialog. Check the printed information and issue the receipt to the customer. A receipt can be reopened and printed again from Sales History.

### Sales History

- SystemAdmin and Manager see all business transactions.
- Cashier sees only transactions completed under their own account.
- Search by receipt, Cashier, or product, or filter by sale date.
- Select **View Details** to review the sold items.
- Select **Receipt** to open and print the persisted receipt.

### Cashier guide

The Cashier's normal workflow is:

1. Sign in with a private password.
2. Open **Record Sales**.
3. Add the customer's products and confirm quantities.
4. Complete the sale.
5. Open the receipt and select **Print Receipt**.
6. Check and issue the printed receipt to the customer.
7. Use **Sales History** when a receipt must be reopened or reprinted.
8. Log out at the end of the shift or before leaving a shared terminal.

Cashiers cannot manage products, view reports, manage employees, read audit logs, or view other Cashiers' transactions.

### Troubleshooting

| Problem | Recommended action |
| --- | --- |
| Login says the credentials are invalid | Check the email and password carefully. After repeated failures, use password recovery or contact the SystemAdmin. |
| Account is temporarily locked | Wait for the lock period, use **Forgot password?**, or ask the SystemAdmin to unlock it. |
| Account is disabled | Ask the SystemAdmin to confirm whether access should be enabled. |
| SIMS requires a password change | Use the temporary password to complete the Change Password form. |
| Recovery email does not arrive | Check spam, verify the registered email, and ask the system owner to check email-delivery logs. |
| Session was revoked or expired | Return to Login and sign in again. |
| A product is missing from the sale list | Ask a Manager or SystemAdmin to confirm that it is active and has stock. |
| Checkout reports insufficient stock | Reload the sale products and correct the cart quantity. No partial sale was saved. |
| Receipt is unavailable to a Cashier | Confirm that the sale was completed under that Cashier's account. |
| Dashboard data cannot load | Check the network connection and select **Retry**. |
| A page redirects to Dashboard | The current role does not have permission to open that page. |

### Safe-use checklist

- Use a unique private password and never share it.
- Never send passwords or recovery links through a public channel.
- Confirm product and quantity information before completing a sale.
- Disable former employee accounts instead of reusing them.
- Use **Force logout** after suspected account exposure.
- Review failed logins and administrative changes in Audit Logs.
- Log out whenever leaving a shared device.

