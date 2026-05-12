const pool = require("../config/db");
const {
  buildBookingWindow,
  toPositiveInteger,
} = require("../utils/validation");

const BOOKING_STATUSES = Object.freeze(["booked", "completed", "cancelled"]);
const VENDOR_STATUS_UPDATES = Object.freeze(["completed", "cancelled"]);

const buildBookingSelect = `
  SELECT bookings.id,
         bookings.user_id,
         bookings.station_id,
         bookings.status,
         bookings.slot_start,
         bookings.slot_end,
         bookings.completed_at,
         bookings.cancelled_at,
         bookings.created_at,
         bookings.updated_at,
         stations.name AS station_name,
         stations.latitude,
         stations.longitude,
         stations.contact
  FROM bookings
  JOIN stations ON bookings.station_id = stations.id
`;

const createBooking = async (req, res) => {
  const userId = req.user.id;
  const stationId = toPositiveInteger(req.body.station_id);

  if (!stationId) {
    return res.status(400).json({
      message: "Station id must be a positive integer",
    });
  }

  const bookingWindow = buildBookingWindow(req.body);

  if (bookingWindow.error) {
    return res.status(400).json({
      message: bookingWindow.error,
    });
  }

  const { slot_start: slotStart, slot_end: slotEnd } = bookingWindow.value;
  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const stationResult = await client.query(
      `SELECT id, total_slots
       FROM stations
       WHERE id = $1 AND is_active = TRUE
       FOR UPDATE`,
      [stationId]
    );

    if (stationResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Station not found",
      });
    }

    const station = stationResult.rows[0];

    const overlappingBookingsResult = await client.query(
      `SELECT COUNT(*)::int AS active_bookings
       FROM bookings
       WHERE station_id = $1
         AND status = 'booked'
         AND slot_start < $3
         AND slot_end > $2`,
      [stationId, slotStart, slotEnd]
    );

    const activeBookings =
      overlappingBookingsResult.rows[0].active_bookings;

    if (activeBookings >= station.total_slots) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "No slots available at this station for the selected time",
      });
    }

    const bookingResult = await client.query(
      `INSERT INTO bookings (user_id, station_id, slot_start, slot_end)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, stationId, slotStart, slotEnd]
    );

    await client.query("COMMIT");

    const { emitSlotUpdate } = require("../socket");
    emitSlotUpdate(stationId, {
      available_slots: station.total_slots - activeBookings - 1,
      total_slots: station.total_slots,
    });

    return res.status(201).json({
      message: "Booking created successfully",
      booking: bookingResult.rows[0],
      available_slots: station.total_slots - activeBookings - 1,
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    return res.status(500).json({
      message: "Server error while creating booking",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `${buildBookingSelect}
       WHERE bookings.user_id = $1
       ORDER BY bookings.id DESC`,
      [userId]
    );

    return res.status(200).json({
      bookings: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching bookings",
    });
  }
};

const getVendorBookings = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { status } = req.query;
    const params = [vendorId];
    let statusFilter = "";

    if (status !== undefined) {
      if (!BOOKING_STATUSES.includes(status)) {
        return res.status(400).json({
          message: "Status must be booked, completed, or cancelled",
        });
      }

      params.push(status);
      statusFilter = "AND bookings.status = $2";
    }

    const result = await pool.query(
      `SELECT bookings.id,
              bookings.user_id,
              users.name AS user_name,
              users.email AS user_email,
              bookings.station_id,
              stations.name AS station_name,
              bookings.status,
              bookings.slot_start,
              bookings.slot_end,
              bookings.completed_at,
              bookings.cancelled_at,
              bookings.created_at,
              bookings.updated_at
       FROM bookings
       JOIN stations ON bookings.station_id = stations.id
       JOIN users ON bookings.user_id = users.id
       WHERE stations.vendor_id = $1
       ${statusFilter}
       ORDER BY bookings.id DESC`,
      params
    );

    return res.status(200).json({
      bookings: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching vendor bookings",
    });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const bookingId = toPositiveInteger(req.params.id);
    const { status } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        message: "Booking id must be a positive integer",
      });
    }

    if (!status || !VENDOR_STATUS_UPDATES.includes(status)) {
      return res.status(400).json({
        message: "Status must be completed or cancelled",
      });
    }

    const result = await pool.query(
      `UPDATE bookings AS booking
       SET status = $1,
           completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END,
           cancelled_at = CASE WHEN $1 = 'cancelled' THEN NOW() ELSE cancelled_at END
       FROM stations AS station
       WHERE booking.id = $2
         AND booking.station_id = station.id
         AND station.vendor_id = $3
         AND booking.status = 'booked'
       RETURNING booking.*`,
      [status, bookingId, vendorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Active booking not found for this vendor",
      });
    }

    return res.status(200).json({
      message: "Booking status updated successfully",
      booking: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while updating booking status",
    });
  }
};

const 
cancelBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = toPositiveInteger(req.params.id);

    if (!bookingId) {
      return res.status(400).json({
        message: "Booking id must be a positive integer",
      });
    }

    const result = await pool.query(
      `UPDATE bookings
       SET status = 'cancelled',
           cancelled_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status = 'booked'
       RETURNING *`,
      [bookingId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Active booking not found for this user",
      });
    }

    const { emitSlotUpdate } = require("../socket");
    
    // Calculate new availability to emit
    const activeResult = await pool.query(
      `SELECT COUNT(*)::int AS active_bookings FROM bookings WHERE station_id = $1 AND status = 'booked' AND slot_start < $3 AND slot_end > $2`,
      [result.rows[0].station_id, result.rows[0].slot_start, result.rows[0].slot_end]
    );
    const stationResult = await pool.query(
      `SELECT total_slots FROM stations WHERE id = $1`, [result.rows[0].station_id]
    );
    
    if (stationResult.rows.length > 0) {
      const active = activeResult.rows[0].active_bookings;
      const total = stationResult.rows[0].total_slots;
      emitSlotUpdate(result.rows[0].station_id, {
        available_slots: Math.max(0, total - active),
        total_slots: total
      });
    }

    return res.status(200).json({
      message: "Booking cancelled successfully",
      booking: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while cancelling booking",
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getVendorBookings,
  updateBookingStatus,
  cancelBooking,
};
