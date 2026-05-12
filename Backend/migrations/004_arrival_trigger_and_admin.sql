-- ============================================================
-- Migration 004: arrival_events updated_at trigger + admin table
-- ============================================================

-- ─── 1. updated_at trigger for arrival_events ────────────────
-- Migration 003 added the trigger for waiting_queue but missed
-- arrival_events. Although arrival rows are immutable in practice,
-- adding the trigger keeps the schema consistent.
DROP TRIGGER IF EXISTS set_arrival_events_updated_at ON arrival_events;

-- arrival_events has no updated_at column yet; add it first.
ALTER TABLE IF EXISTS arrival_events
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TRIGGER set_arrival_events_updated_at
BEFORE UPDATE ON arrival_events
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── 2. Admins table ─────────────────────────────────────────
-- ROLES.ADMIN is referenced in middleware but had no backing table
-- or registration route. This table enables seeded admin accounts.
CREATE TABLE IF NOT EXISTS admins (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password      TEXT          NOT NULL,
  role          VARCHAR(20)   NOT NULL DEFAULT 'ADMIN'
                  CHECK (role = 'ADMIN'),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

DROP TRIGGER IF EXISTS set_admins_updated_at ON admins;
CREATE TRIGGER set_admins_updated_at
BEFORE UPDATE ON admins
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
