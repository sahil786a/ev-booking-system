CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role = 'USER'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20);

UPDATE users
SET role = 'USER'
WHERE role IS NULL OR role <> 'USER';

ALTER TABLE IF EXISTS users
  ALTER COLUMN role SET DEFAULT 'USER',
  ALTER COLUMN role SET NOT NULL;

CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  business_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(30) NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'VENDOR' CHECK (role = 'VENDOR'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stations (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  contact VARCHAR(30) NOT NULL,
  total_slots INTEGER NOT NULL CHECK (total_slots > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Existing databases may already have stations without ownership.
-- Assign real vendor ids to those rows before enforcing vendor_id as NOT NULL:
-- UPDATE stations SET vendor_id = <vendor_id> WHERE vendor_id IS NULL;
-- ALTER TABLE stations ALTER COLUMN vendor_id SET NOT NULL;
ALTER TABLE IF EXISTS stations
  ADD COLUMN IF NOT EXISTS vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  station_id INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'booked'
    CHECK (status IN ('booked', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stations_vendor_id ON stations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_station_id_status
  ON bookings(station_id, status);
