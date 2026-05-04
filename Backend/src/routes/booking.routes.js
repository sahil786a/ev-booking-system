
const express = require("express");
const {
  createBooking,
  getMyBookings,
  updateBookingStatus,
  cancelBooking,
} = require("../controllers/booking.controller");
const protect = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/my", protect, getMyBookings);
router.patch("/:id/status", protect, updateBookingStatus);
router.patch("/:id/cancel", protect, cancelBooking);

module.exports = router;
