const express = require("express");
const {
  createBooking,
  getMyBookings,
  getVendorBookings,
  updateBookingStatus,
  cancelBooking,
} = require("../controllers/booking.controller");
const { requireUser, requireVendor } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", ...requireUser, createBooking);
router.get("/my", ...requireUser, getMyBookings);
router.get("/vendor", ...requireVendor, getVendorBookings);
router.patch("/:id/status", ...requireVendor, updateBookingStatus);
router.patch("/:id/cancel", ...requireUser, cancelBooking);

module.exports = router;
