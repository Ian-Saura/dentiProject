-- Migration: Make password_hash nullable for Google OAuth users
-- Date: 2025-10-22

-- Make password_hash nullable
ALTER TABLE usuarios ALTER COLUMN password_hash DROP NOT NULL;

-- Add comment to explain
COMMENT ON COLUMN usuarios.password_hash IS 'Password hash for local authentication. NULL for OAuth users (Google, etc.)';




