const pool = require("../config/db");

const createBooking = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const { station_id } = req.body;

    if (!station_id) {
      return res.status(400).json({
        message: "Station id is required",
      });
    }

    await client.query("BEGIN");

    const stationResult = await client.query(
      "SELECT * FROM stations WHERE id = $1 FOR UPDATE",
      [station_id]
    );

    if (stationResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Station not found",
      });
    }

    const station = stationResult.rows[0];

    const activeBookingsResult = await client.query(
      `SELECT COUNT(*)::int AS active_bookings
       FROM bookings
       WHERE station_id = $1 AND status = 'booked'`,
      [station_id]
    );

    const activeBookings = activeBookingsResult.rows[0].active_bookings;

    if (activeBookings >= station.total_slots) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "No slots available at this station",
      });
    }

    const bookingResult = await client.query(
      `INSERT INTO bookings (user_id, station_id)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, station_id]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Booking created successfully",
      booking: bookingResult.rows[0],
      available_slots: station.total_slots - activeBookings - 1,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return res.status(500).json({
      message: "Server error while creating booking",
    });
  } finally {
    client.release();
  }
};

const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT bookings.id,
              bookings.status,
              bookings.created_at,
              stations.id AS station_id,
              stations.name AS station_name,
              stations.latitude,
              stations.longitude,
              stations.contact
       FROM bookings
       JOIN stations ON bookings.station_id = stations.id
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

const updateBookingStatus = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["booked", "completed", "cancelled"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Status must be booked, completed, or cancelled",
      });
    }

    const result = await pool.query(
      `UPDATE bookings AS booking
       SET status = $1
       FROM stations AS station
       WHERE booking.id = $2
         AND booking.station_id = station.id
         AND station.vendor_id = $3
       RETURNING booking.*`,
      [status, id, vendorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Booking not found for this vendor",
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

const cancelBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE bookings
       SET status = 'cancelled'
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Booking not found for this user",
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
  updateBookingStatus,
  cancelBooking,
};
