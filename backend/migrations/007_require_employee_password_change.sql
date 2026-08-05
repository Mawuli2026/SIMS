BEGIN;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_must_change_password
ON users (id)
WHERE must_change_password = TRUE;

COMMIT;
