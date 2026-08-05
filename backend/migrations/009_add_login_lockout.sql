BEGIN;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_failed_login_attempts_nonnegative'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_failed_login_attempts_nonnegative
    CHECK (failed_login_attempts >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_locked_until
ON users (locked_until)
WHERE locked_until IS NOT NULL;

COMMIT;
