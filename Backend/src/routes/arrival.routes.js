const express = require("express");
const { checkIn, checkOut, getArrivalEvents } = require("../controllers/arrival.controller");
const { requireUser } = require("../middleware/auth.middleware");

const router = express.Router();

// POST /api/arrivals/:bookingId/checkin  — GPS check-in
router.post("/:bookingId/checkin", ...requireUser, checkIn);

// POST /api/arrivals/:bookingId/checkout — GPS check-out (completes booking)
router.post("/:bookingId/checkout", ...requireUser, checkOut);

// GET  /api/arrivals/:bookingId/events   — list all arrival events
router.get("/:bookingId/events", ...requireUser, getArrivalEvents);

module.exports = router;
