-- ============================================================
-- Migration 005: Refresh Token Store
-- ============================================================
-- Enables long-lived refresh tokens so users don't need to
-- re-authenticate every time the 1-day access token expires.
--
-- Design:
--   - Each login/register creates one row.
--   - Access tokens stay short-lived (1d JWTs, no DB lookup needed).
--   - Refresh tokens are opaque UUIDs stored here; revocation just
--     sets revoked_at — no need to touch the JWT secret.
--   - Supports both USER and VENDOR subjects (one nullable FK each).

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id            SERIAL PRIMARY KEY,
  token         TEXT          NOT NULL UNIQUE,
  user_id       INTEGER       REFERENCES users(id)   ON DELETE CASCADE,
  vendor_id     INTEGER       REFERENCES vendors(id) ON DELETE CASCADE,
  subject_type  VARCHAR(20)   NOT NULL CHECK (subject_type IN ('user', 'vendor')),
  expires_at    TIMESTAMPTZ   NOT NULL,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  -- Exactly one subject must be set
  CONSTRAINT chk_refresh_token_one_subject CHECK (
    (user_id IS NOT NULL AND vendor_id IS NULL) OR
    (vendor_id IS NOT NULL AND user_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_rt_token        ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_rt_user_id      ON refresh_tokens(user_id)   WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rt_vendor_id    ON refresh_tokens(vendor_id) WHERE vendor_id IS NOT NULL;

-- Clean up tokens expired more than 30 days ago (maintenance helper):
-- DELETE FROM refresh_tokens WHERE expires_at < NOW() - INTERVAL '30 days';
