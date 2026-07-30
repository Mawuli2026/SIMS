-- Seeds (or repairs) the two default accounts used for testing/demo login.
-- Password for BOTH accounts: secrete123
-- The hash below was generated with bcrypt, 12 salt rounds — the exact same
-- settings used by src/utils/password.ts, so it will verify correctly via
-- POST /api/auth/login.
--
-- Safe to re-run: ON CONFLICT (email) DO UPDATE overwrites the password hash
-- and role, so this also "fixes" either account if it was created earlier
-- with a different/incorrect password or role.

INSERT INTO users (first_name, last_name, email, password_hash, role)
VALUES
  ('Admin', 'User', 'admin@sims.com', '$2b$12$CaZ2bBU3gImDWrzE68HWPevWgdVbnN3HHpJ/JDaFKocVFvomWp/fy', 'Admin'),
  ('Cashier', 'User', 'cashier@sims.com', '$2b$12$CaZ2bBU3gImDWrzE68HWPevWgdVbnN3HHpJ/JDaFKocVFvomWp/fy', 'Cashier')
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    updated_at = CURRENT_TIMESTAMP;
