/**
 * Arrival Controller
 * ------------------
 * GPS-based check-in / check-out for booked charging slots.
 *
 * BUG PREDICTIONS & MITIGATIONS:
 *   - Check-in after slot_start has expired: we allow check-in
 *     within the grace window only; after no-show fires it's too late.
 *   - Double check-in: allowed (user may lose GPS then reconnect).
 *     The no-show scheduler checks for ANY 'checkin' event, so even
 *     a late re-check-in saves the booking from being marked no_show.
 *   - Distance calculation: done in-process using Haversine (no
 *     external API call → no network failure risk). Accuracy is
 *     sufficient for station-level proximity (within ~50 m radius).
 *   - Booking doesn't belong to user: we validate user_id = req.user.id
 *     in the WHERE clause — no IDOR possible.
 *   - checkout before checkin: we require at least one prior 'checkin'
 *     event before accepting a 'checkout'.
 */

const pool = require("../config/db");
const { toPositiveInteger } = require("../utils/validation");
const { emitSlotUpdate } = require("../socket");

const CHECKIN_RADIUS_M = 200;   // must be within 200 m to check in
const CHECKOUT_RADIUS_M = 500;  // slightly relaxed for checkout

/** Haversine distance in metres between two lat/lon pairs. */
function haversineMetres(lat1, lon1, lat2, lon2) {
  const R = 6_371_000; // Earth radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * POST /api/arrivals/:bookingId/checkin
 * Body: { latitude, longitude }
 */
const checkIn = async (req, res) => {
  const userId = req.user.id;
  const bookingId = toPositiveInteger(req.params.bookingId);

  if (!bookingId) {
    return res.status(400).json({ message: "Booking id must be a positive integer" });
  }

  const userLat = Number(req.body.latitude);
  const userLon = Number(req.body.longitude);

  if (!Number.isFinite(userLat) || !Number.isFinite(userLon)) {
    return res.status(400).json({ message: "latitude and longitude are required and must be numbers" });
  }

  try {
    // ── Fetch booking + station coords in one query ──
    const bookingResult = await pool.query(
      `SELECT b.id, b.status, b.slot_start, b.slot_end,
              b.station_id,
              s.latitude  AS station_lat,
              s.longitude AS station_lon,
              s.total_slots,
              COALESCE(s.noshow_grace_minutes, 15) AS grace_minutes
         FROM bookings b
         JOIN stations s ON s.id = b.station_id
        WHERE b.id = $1 AND b.user_id = $2`,
      [bookingId, userId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = bookingResult.rows[0];

    if (booking.status !== "booked") {
      return res.status(409).json({
        message: `Cannot check in — booking status is '${booking.status}'`,
      });
    }

    // ── Enforce: check-in must be before grace window expires ──
    const graceDeadline = new Date(
      new Date(booking.slot_start).getTime() +
        booking.grace_minutes * 60_000
    );
    if (new Date() > graceDeadline) {
      return res.status(409).json({
        message: "Check-in window has expired for this booking",
      });
    }

    // ── Distance validation ──
    const distanceM = haversineMetres(
      userLat,
      userLon,
      Number(booking.station_lat),
      Number(booking.station_lon)
    );

    if (distanceM > CHECKIN_RADIUS_M) {
      return res.status(422).json({
        message: `You are ${Math.round(distanceM)} m from the station — must be within ${CHECKIN_RADIUS_M} m to check in`,
        distance_m: Math.round(distanceM),
      });
    }

    // ── Record arrival event ──
    const event = await pool.query(
      `INSERT INTO arrival_events
         (booking_id, user_id, station_id, event_type, latitude, longitude, distance_m)
       VALUES ($1, $2, $3, 'checkin', $4, $5, $6)
       RETURNING *`,
      [bookingId, userId, booking.station_id, userLat, userLon, Math.round(distanceM)]
    );

    return res.status(201).json({
      message: "Check-in recorded successfully",
      event: event.rows[0],
      distance_m: Math.round(distanceM),
    });
  } catch (err) {
    console.error("[arrival] checkIn error:", err.message);
    return res.status(500).json({ message: "Server error while recording check-in" });
  }
};

/**
 * POST /api/arrivals/:bookingId/checkout
 * Body: { latitude, longitude }
 * Marks booking as 'completed' and emits a slot_update.
 */
const checkOut = async (req, res) => {
  const userId = req.user.id;
  const bookingId = toPositiveInteger(req.params.bookingId);

  if (!bookingId) {
    return res.status(400).json({ message: "Booking id must be a positive integer" });
  }

  const userLat = Number(req.body.latitude);
  const userLon = Number(req.body.longitude);

  if (!Number.isFinite(userLat) || !Number.isFinite(userLon)) {
    return res.status(400).json({ message: "latitude and longitude are required and must be numbers" });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const bookingResult = await client.query(
      `SELECT b.id, b.status, b.slot_start, b.slot_end,
              b.station_id,
              s.latitude  AS station_lat,
              s.longitude AS station_lon,
              s.total_slots
         FROM bookings b
         JOIN stations s ON s.id = b.station_id
        WHERE b.id = $1 AND b.user_id = $2
        FOR UPDATE OF b`,
      [bookingId, userId]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = bookingResult.rows[0];

    if (booking.status !== "booked") {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: `Cannot check out — booking status is '${booking.status}'`,
      });
    }

    // ── Require at least one prior check-in ──
    const checkinResult = await client.query(
      `SELECT id FROM arrival_events
        WHERE booking_id = $1 AND event_type = 'checkin'
        LIMIT 1`,
      [bookingId]
    );
    if (checkinResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "You must check in before checking out",
      });
    }

    // ── Distance validation (relaxed radius) ──
    const distanceM = haversineMetres(
      userLat,
      userLon,
      Number(booking.station_lat),
      Number(booking.station_lon)
    );

    if (distanceM > CHECKOUT_RADIUS_M) {
      await client.query("ROLLBACK");
      return res.status(422).json({
        message: `You are ${Math.round(distanceM)} m from the station — must be within ${CHECKOUT_RADIUS_M} m to check out`,
        distance_m: Math.round(distanceM),
      });
    }

    // ── Record checkout event ──
    const event = await client.query(
      `INSERT INTO arrival_events
         (booking_id, user_id, station_id, event_type, latitude, longitude, distance_m)
       VALUES ($1, $2, $3, 'checkout', $4, $5, $6)
       RETURNING *`,
      [bookingId, userId, booking.station_id, userLat, userLon, Math.round(distanceM)]
    );

    // ── Mark booking as completed ──
    await client.query(
      `UPDATE bookings
          SET status = 'completed', completed_at = NOW()
        WHERE id = $1`,
      [bookingId]
    );

    // ── Calculate updated available slots ──
    const activeResult = await client.query(
      `SELECT COUNT(*)::int AS active_bookings
         FROM bookings
        WHERE station_id = $1
          AND status     = 'booked'
          AND slot_start < $3
          AND slot_end   > $2`,
      [booking.station_id, booking.slot_start, booking.slot_end]
    );
    const available = booking.total_slots - activeResult.rows[0].active_bookings;

    await client.query("COMMIT");

    emitSlotUpdate(booking.station_id, {
      available_slots: Math.max(0, available),
      total_slots: booking.total_slots,
    });

    return res.status(200).json({
      message: "Check-out recorded — booking completed",
      event: event.rows[0],
      distance_m: Math.round(distanceM),
    });
  } catch (err) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    console.error("[arrival] checkOut error:", err.message);
    return res.status(500).json({ message: "Server error while recording check-out" });
  } finally {
    if (client) client.release();
  }
};

/**
 * GET /api/arrivals/:bookingId/events
 * Returns all arrival events for a booking (visible to the booking owner only).
 */
const getArrivalEvents = async (req, res) => {
  const userId = req.user.id;
  const bookingId = toPositiveInteger(req.params.bookingId);

  if (!bookingId) {
    return res.status(400).json({ message: "Booking id must be a positive integer" });
  }

  try {
    // Verify booking belongs to user
    const bookingCheck = await pool.query(
      `SELECT id FROM bookings WHERE id = $1 AND user_id = $2`,
      [bookingId, userId]
    );
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const result = await pool.query(
      `SELECT * FROM arrival_events
        WHERE booking_id = $1
        ORDER BY recorded_at ASC`,
      [bookingId]
    );

    return res.status(200).json({ events: result.rows });
  } catch (err) {
    console.error("[arrival] getArrivalEvents error:", err.message);
    return res.status(500).json({ message: "Server error while fetching arrival events" });
  }
};

module.exports = { checkIn, checkOut, getArrivalEvents };
