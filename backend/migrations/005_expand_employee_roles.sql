BEGIN;

ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

UPDATE users
SET role = 'Manager',
    updated_at = CURRENT_TIMESTAMP
WHERE role = 'Admin';

ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('SystemAdmin', 'Manager', 'Cashier'));

COMMIT;
