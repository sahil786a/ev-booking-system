-- ============================================================
-- Migration 003: Waiting Queue + GPS Arrival Events + No-Show Config
-- ============================================================

-- ─── 1. Waiting Queue ────────────────────────────────────────
-- One row per (user, station, slot_window). Enforces no duplicate
-- position for the same user at the same station for overlapping windows.
CREATE TABLE IF NOT EXISTS waiting_queue (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER       NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
  station_id    INTEGER       NOT NULL REFERENCES stations(id)  ON DELETE CASCADE,
  slot_start    TIMESTAMPTZ   NOT NULL,
  slot_end      TIMESTAMPTZ   NOT NULL,
  status        VARCHAR(20)   NOT NULL DEFAULT 'waiting'
                  CHECK (status IN ('waiting', 'promoted', 'expired', 'cancelled')),
  promoted_booking_id INTEGER  REFERENCES bookings(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT wq_slot_time_check CHECK (slot_end > slot_start)
);

-- Prevent the same user from being in the queue twice for the
-- same station at the same time (only one active entry allowed).
CREATE UNIQUE INDEX IF NOT EXISTS idx_wq_unique_active
  ON waiting_queue(user_id, station_id, slot_start, slot_end)
  WHERE status = 'waiting';

CREATE INDEX IF NOT EXISTS idx_wq_station_status
  ON waiting_queue(station_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_wq_user_status
  ON waiting_queue(user_id, status);

-- ─── 2. Arrival Events ───────────────────────────────────────
-- Records each GPS check-in / check-out against a booking.
-- Allows multiple retries (e.g., user goes back to car and returns).
CREATE TABLE IF NOT EXISTS arrival_events (
  id          SERIAL PRIMARY KEY,
  booking_id  INTEGER       NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id     INTEGER       NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  station_id  INTEGER       NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  event_type  VARCHAR(20)   NOT NULL CHECK (event_type IN ('checkin', 'checkout')),
  latitude    NUMERIC(10,7) NOT NULL,
  longitude   NUMERIC(10,7) NOT NULL,
  distance_m  NUMERIC(10,2),          -- distance from station centroid at event time
  recorded_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arrival_booking
  ON arrival_events(booking_id, event_type, recorded_at DESC);

-- ─── 3. No-Show Config on Stations ───────────────────────────
-- Vendors can customise the grace window (default 15 min).
ALTER TABLE IF EXISTS stations
  ADD COLUMN IF NOT EXISTS noshow_grace_minutes INTEGER NOT NULL DEFAULT 15
    CHECK (noshow_grace_minutes BETWEEN 5 AND 120);

-- ─── 4. Bookings: track no-show timestamp ────────────────────
ALTER TABLE IF EXISTS bookings
  ADD COLUMN IF NOT EXISTS noshow_at TIMESTAMPTZ;

-- Extend the status enum to include 'no_show'
-- PostgreSQL does not allow removing values from enums easily,
-- so we alter the CHECK constraint via a new migration safely.
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_status_check
    CHECK (status IN ('booked', 'completed', 'cancelled', 'no_show'));

-- ─── 5. updated_at triggers for new tables ───────────────────
DROP TRIGGER IF EXISTS set_waiting_queue_updated_at ON waiting_queue;
CREATE TRIGGER set_waiting_queue_updated_at
BEFORE UPDATE ON waiting_queue
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
