# EV Charging Booking System Backend

Production-focused REST API for an EV charging station booking system.

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
├── migrations/
├── scripts/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   ├── constants/
│   ├── controllers/
│   ├── middleware/
│   └── routes/
└── test/
```

## Local Setup

```powershell
cd Backend
npm install
```

Create `Backend/.env` from `Backend/.env.example`, then update the database password and JWT secret.

```powershell
npm run migrate
npm run dev
```

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
PATCH /api/bookings/:id/status
PATCH /api/bookings/:id/cancel
```

## Roles

- `USER`: can create/cancel their own bookings.
- `VENDOR`: can create/update/delete their stations and complete/cancel bookings for their stations.

## Tests

```powershell
cd Backend
npm test
```
