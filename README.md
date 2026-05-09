# EV Charging Booking System Backend

Production-focused REST API for an EV charging station locator and slot booking
system. Payment and SMS booking are planned future modules; the current backend
implements the working MVP booking flow.

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- `pg`
- JWT authentication
- bcrypt password hashing

## Backend Folder

```text
Backend/
  migrations/
  scripts/
  src/
    app.js
    server.js
    config/
    constants/
    controllers/
    middleware/
    routes/
    utils/
  test/
```

## Local Setup

```powershell
cd Backend
npm.cmd install
npm.cmd run migrate
npm.cmd run dev
```

Create `Backend/.env` from `Backend/.env.example`, then update the database
password and JWT secret.

Health check:

```text
GET http://localhost:5000/health
```

## Main API Routes

Auth:

```text
POST /api/auth/users/register
POST /api/auth/users/login
POST /api/auth/vendors/register
POST /api/auth/vendors/login
GET  /api/auth/users/profile
GET  /api/auth/vendors/profile
```

Stations:

```text
POST   /api/stations
GET    /api/stations
GET    /api/stations/mine
GET    /api/stations/:id
GET    /api/stations/:id/availability
PUT    /api/stations/:id
DELETE /api/stations/:id
```

Bookings:

```text
POST  /api/bookings
GET   /api/bookings/my
GET   /api/bookings/vendor
PATCH /api/bookings/:id/status
PATCH /api/bookings/:id/cancel
```

## Booking Request Formats

Immediate booking, defaults to a one-hour slot from the current time:

```json
{
  "station_id": 4
}
```

Scheduled booking with local date and time:

```json
{
  "station_id": 4,
  "booking_date": "2026-05-09",
  "start_time": "10:00",
  "end_time": "11:00"
}
```

Scheduled booking with ISO timestamps:

```json
{
  "station_id": 4,
  "slot_start": "2026-05-09T10:00:00+05:30",
  "slot_end": "2026-05-09T11:00:00+05:30"
}
```

Availability can use the same time-window query fields:

```text
GET /api/stations/4/availability?booking_date=2026-05-09&start_time=10:00&end_time=11:00
```

## Roles

- `USER`: can create/cancel their own bookings.
- `VENDOR`: can create/update/delete their stations and complete/cancel bookings
  for their stations.

## Tests

```powershell
cd Backend
npm.cmd test
```
