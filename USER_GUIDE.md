# SIMS User Guide

## 1. Purpose of SIMS

The Sales and Inventory Management System (SIMS) helps a small supermarket manage employee access, products, inventory, sales, receipts, reports, and security records from one application.

SIMS has three user roles:

- **SystemAdmin** manages employees and security in addition to performing management work.
- **Manager** manages inventory, sales, and reports.
- **Cashier** records sales and reviews only the transactions completed under their account.

Public account registration is not available. The first SystemAdmin is created during system setup, and that SystemAdmin creates Manager and Cashier accounts.

## 2. Role permissions

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

## 3. Signing in and account security

### Sign in

1. Open the SIMS web address supplied by the system owner. For local use, this is normally `http://localhost:5173/login`.
2. Enter your employee email address and password.
3. Select **Log in**.
4. SIMS opens the dashboard permitted for your current role.

There is no **Create Account** link. Contact the SystemAdmin if you need an employee account.

### First login with a temporary password

Manager and Cashier accounts are created with temporary passwords.

1. Sign in using the email and temporary password supplied by the SystemAdmin.
2. SIMS redirects you to **Change Password**.
3. Enter the temporary password as the current password.
4. Enter and confirm a private new password of at least 12 characters.
5. Submit the form. SIMS signs the current device into a new secured session.

Dashboard and business pages remain unavailable until this change is completed. Do not continue using or share the temporary password.

### Change your password later

1. Select your profile icon in the upper-right corner.
2. Select **Change Password**.
3. Enter your current password.
4. Enter and confirm a different new password of at least 12 characters.
5. Submit the form.

Changing a password invalidates previously issued sessions. The current device receives a replacement session; other devices must sign in again.

### Recover a forgotten password

1. On the login page, select **Forgot password?**
2. Enter the email address registered on your SIMS account.
3. Submit the request. SIMS always displays a general confirmation message for account security.
4. Check the inbox and spam folder for **Reset your SIMS password**.
5. Open the recovery link and enter a new password.

The link expires after the configured recovery period, normally 30 minutes, and works only once. Completing recovery unlocks the account and invalidates older sessions. Contact the SystemAdmin if the registered email is incorrect or no message arrives.

### Failed logins, disabled accounts, and revoked sessions

- By default, five failed login attempts within 15 minutes temporarily lock an account for 15 minutes.
- Wait for the lock to expire, use password recovery, or ask the SystemAdmin to select **Unlock**.
- A disabled employee cannot sign in. Only the SystemAdmin can enable the account.
- If the SystemAdmin uses **Force logout**, the employee must sign in again on every device.
- A `401` session message normally means the session expired, was revoked, or no longer matches the account. Return to the login page and sign in again.
- A `403` permission message means the signed-in role cannot use that function.

### Profile and logout

Select the profile icon to:

- Open **My Profile** and review your name, email, role, and date joined.
- Open **Change Password**.
- Select **Logout**.

Always log out after using SIMS on a shared computer.

## 4. Shared dashboard features

### Navigation

Use the sidebar to open the pages available to your role. Use the menu button in the top bar to collapse or expand the sidebar.

### Notifications

Select the notification button in the top bar.

- SystemAdmin and Manager notifications include recent completed sales and low-stock warnings.
- Cashier notifications include recent sales completed under that Cashier account.

### Search

Use the top search box to find products, sales, or receipt numbers. Select a result to open the related page. Cashier sale and receipt results are limited to transactions completed under the signed-in Cashier account.

## 5. SystemAdmin guide

The SystemAdmin has all Manager capabilities plus employee administration and audit-log access.

### SystemAdmin dashboard

The dashboard displays:

- Revenue recorded today.
- Number of completed sales today.
- Number of active products.
- Number of low-stock products.
- Recent sales.
- Products at or below their reorder level.

### Create an employee

1. Open **Employees**.
2. Select **+ Add Employee**.
3. Enter the employee's first name, last name, and real email address.
4. Select **Manager** or **Cashier**.
5. Enter and confirm a temporary password of at least 12 characters.
6. Select **Create Employee**.
7. Give the temporary password to the employee securely and instruct them to replace it at first login.

Email addresses must be unique. The Employee page cannot create another SystemAdmin.

### Find and review employees

The Employee page supports:

- Searching by name or email.
- Filtering by SystemAdmin, Manager, or Cashier role.
- Filtering by Active or Disabled status.
- Reviewing creation date, last login, creator, login-lock state, and whether a password change is required.

### Change an employee's role

1. Find the employee on the Employee page.
2. Change the role selector to **Manager** or **Cashier**.
3. Wait for the success confirmation.

The new permission is enforced on the employee's next request. Use **Force logout** when the employee should immediately start a completely new session.

### Disable or enable an employee

- Select **Disable** to prevent future logins and reject existing sessions immediately.
- Select **Enable** to restore login access.

Enabling an account does not restore sessions issued before it was disabled. The employee must sign in again. Employee accounts are retained instead of deleted so historical sales keep the correct cashier information.

### Reset an employee's temporary password

1. Select **Reset password** beside the employee.
2. Enter and confirm a new temporary password of at least 12 characters.
3. Select **Set Temporary Password**.
4. Deliver it securely to the employee.

This action invalidates old sessions and requires the employee to choose a private password before accessing dashboard functions.

### Force logout

Select **Force logout** to invalidate every current session belonging to an employee. Use this after a suspected account compromise, role-sensitive change, or use of a lost/shared device.

### Unlock an employee

When **Login locked** appears:

1. Confirm the employee's identity and investigate unexpected attempts.
2. Select **Unlock**.
3. Ask the employee to try again or use **Forgot password?** if they do not know the password.

### Protected SystemAdmin account

The bootstrap-created SystemAdmin row displays **Protected**. It cannot be disabled, reassigned, reset, or force-logged-out through Employee Management. The SystemAdmin should use their profile's **Change Password** option or email password recovery for their own account.

### Audit logs

Open **Audit Logs** to review the latest security and operational events. Logs cover login outcomes, lockouts, password actions, employee administration, product changes, and completed sales.

Use the controls to filter by:

- Search text such as actor, target, action, or record.
- Action type.
- Success or failure outcome.
- Start and end date.

Each row shows the time, action, outcome, actor, affected user or record, safe operational details, and connection address. Passwords, JWTs, temporary passwords, and reset tokens are not stored in audit details.

## 6. Manager guide

### Manager dashboard

The Manager dashboard displays the same business-wide sales and inventory summaries available to the SystemAdmin, without employee-management or audit-log access.

### Product and inventory management

Open **Products** to review products or search by product name or category.

#### Add a product

1. Select **+ Add Product**.
2. Enter the product name and category.
3. Enter cost price and selling price.
4. Enter the current quantity in stock.
5. Enter the reorder level.
6. Select **Save Product**.

Use a reorder level that reflects when the supermarket should obtain more stock.

#### Edit a product

1. Find the product.
2. Select **Edit**.
3. Correct the product, pricing, stock, or reorder information.
4. Select **Save Changes**.

Completed receipts retain the product name and selling price recorded at the time of sale. Editing a product does not rewrite historical sales.

#### Activate or deactivate a product

- Select **Deactivate** to remove a product from new sales without deleting it.
- Select **Activate** to make it available again.

Use deactivation for discontinued or temporarily unavailable products. Only active products with available stock can be added to a new sale.

### Low-stock page

Open **Low Stock** to see active products whose stock quantity is at or below their reorder level. Update inventory from the Product page after new stock arrives.

### Reports

Open **Reports** to view:

- Total revenue.
- Number of completed transactions.
- Number of items sold.
- Average sale amount.
- Product performance.
- Cashier performance.

Use **From** and **To** to restrict the report to a date range. Select **All Time** to remove the range. The start date cannot be later than the end date.

## 7. Recording sales — all roles

SystemAdmin, Manager, and Cashier can record sales.

### Create a sale

1. Open **Sales** or **Record Sales**.
2. Select an active product from the Product list.
3. Enter a quantity no greater than the displayed available stock.
4. Select **Add to Sale**.
5. Repeat for other products.
6. Review each item, unit price, quantity, line total, and overall total.
7. Adjust a cart quantity when necessary or select **Remove** to remove an item.
8. Select **Complete Sale** only after confirming the cart with the customer.

SIMS reads the current price and stock from PostgreSQL when checkout is completed. It then saves the sale and reduces all selected inventory in one transaction. If a product becomes unavailable or lacks stock, the sale is rejected without partially reducing inventory; reload the products and correct the cart.

### Receipt

After checkout, the Cashier should open the generated receipt and review:

- Receipt number.
- Date and time.
- Cashier name and email.
- Product names, unit prices, quantities, and line totals.
- Total amount.

Select **Print Receipt** to use the browser's print dialog, print the receipt, and issue it to the customer before completing the checkout interaction. The same receipt can be reopened and printed again later from Sales History when a customer requests a replacement.

## 8. Sales History

Open **Sales History** to review completed transactions.

- SystemAdmin and Manager see all business transactions.
- Cashier sees only transactions completed under their own account.

Use the search box to find a receipt, cashier, or product, and use **Sale date** to filter by date. Select **Clear Filters** to restore the complete permitted list.

- Select **View Details** to expand the sold items within the history table.
- Select **Receipt** to open the printable receipt.

Cashiers cannot open a receipt belonging to another Cashier.

## 9. Cashier guide

### Cashier dashboard

The Cashier dashboard shows:

- Total value of the signed-in Cashier's sales today.
- Number of the signed-in Cashier's sales today.
- A shortcut to **Record Sale**.
- The signed-in Cashier's recent sales.

The Cashier's normal workflow is:

1. Sign in with a private password.
2. Open **Record Sales**.
3. Add the customer's products and confirm quantities.
4. Complete the sale.
5. Open the completed receipt, select **Print Receipt**, and check that the printed information is correct.
6. Issue the printed receipt to the customer.
7. Use **Sales History** when a receipt needs to be reopened or reprinted.
8. Log out at the end of the shift or before leaving a shared terminal.

Cashiers cannot manage products, view reports, manage employees, read audit logs, or view other Cashiers' transactions.

## 10. Troubleshooting

| Problem | Recommended action |
| --- | --- |
| Login says the credentials are invalid | Check the email and password carefully. After repeated failures, stop and use password recovery or contact the SystemAdmin. |
| Account is temporarily locked | Wait for the lock period, use **Forgot password?**, or ask the SystemAdmin to unlock it. |
| Account is disabled | Ask the SystemAdmin to confirm whether access should be enabled. |
| SIMS requires a password change | Complete the Change Password form using the temporary password before opening other pages. |
| Recovery email does not arrive | Check spam, verify the registered email, and ask the SystemAdmin or system owner to check email-delivery logs. |
| Session was revoked or expired | Return to Login and sign in again. |
| A product is missing from the sale list | Ask a Manager or SystemAdmin to confirm that it is active and has stock. |
| Checkout reports insufficient stock | Reload the sale products and correct the cart quantity. No partial sale was saved. |
| Receipt is unavailable to a Cashier | Confirm that the sale was completed under that Cashier's account. |
| Dashboard data cannot load | Check the network connection and use **Retry**. Contact the system owner if the API remains unavailable. |
| A page redirects to Dashboard | The current role does not have permission to open that page. |

## 11. Safe-use checklist

- Use a unique private password and never share it.
- Never send passwords or recovery links through a public channel.
- Confirm product and quantity information before completing a sale.
- Disable former employee accounts instead of reusing them.
- Use **Force logout** after suspected account exposure.
- Review failed logins and administrative changes in Audit Logs.
- Log out whenever leaving a shared device.
