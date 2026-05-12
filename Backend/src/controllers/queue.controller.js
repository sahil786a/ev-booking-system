/**
 * Queue Controller
 * ----------------
 * Handles joining, leaving, and inspecting the waiting queue.
 *
 * BUG PREDICTIONS & MITIGATIONS:
 *   - Duplicate queue join: unique partial index on waiting_queue
 *     guarantees at most one 'waiting' entry per (user, station, window).
 *     We catch pg error code 23505 and return 409.
 *   - Queue join after a slot frees up: we check live availability
 *     before inserting; if a slot is free we reject with a 400
 *     telling the client to book directly instead.
 *   - Slot window mismatch vs. original booking: we reuse the same
 *     buildBookingWindow util so format validation is consistent.
 */

const pool = require("../config/db");
const { buildBookingWindow, toPositiveInteger } = require("../utils/validation");
const { emitQueueUpdate } = require("../socket");

/**
 * POST /api/queue/:stationId/join
 * Authenticated user joins the waiting queue for a station + time window.
 */
const joinQueue = async (req, res) => {
  const userId = req.user.id;
  const stationId = toPositiveInteger(req.params.stationId);

  if (!stationId) {
    return res.status(400).json({ message: "Station id must be a positive integer" });
  }

  const bookingWindow = buildBookingWindow(req.body);
  if (bookingWindow.error) {
    return res.status(400).json({ message: bookingWindow.error });
  }

  const { slot_start: slotStart, slot_end: slotEnd } = bookingWindow.value;
  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // ── Guard 1: Station must exist and be active ──
    const stationResult = await client.query(
      `SELECT id, total_slots FROM stations WHERE id = $1 AND is_active = TRUE`,
      [stationId]
    );
    if (stationResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Station not found" });
    }

    const { total_slots: totalSlots } = stationResult.rows[0];

    // ── Guard 2: Don't queue if slots are actually free ──
    const overlapResult = await client.query(
      `SELECT COUNT(*)::int AS active_bookings
         FROM bookings
        WHERE station_id = $1
          AND status     = 'booked'
          AND slot_start < $3
          AND slot_end   > $2`,
      [stationId, slotStart, slotEnd]
    );
    const active = overlapResult.rows[0].active_bookings;
    if (active < totalSlots) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Slots are still available — please book directly",
        available_slots: totalSlots - active,
      });
    }

    // ── Guard 3: User must not already have a booking for this window ──
    const existingBookingResult = await client.query(
      `SELECT id FROM bookings
        WHERE user_id    = $1
          AND station_id = $2
          AND status     = 'booked'
          AND slot_start = $3
          AND slot_end   = $4`,
      [userId, stationId, slotStart, slotEnd]
    );
    if (existingBookingResult.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "You already have a booking for this station and time slot",
      });
    }

    // ── Insert queue entry ──
    const insertResult = await client.query(
      `INSERT INTO waiting_queue (user_id, station_id, slot_start, slot_end)
         VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, stationId, slotStart, slotEnd]
    );

    // ── Queue length for socket broadcast ──
    const queueCountResult = await client.query(
      `SELECT COUNT(*)::int AS queue_length
         FROM waiting_queue
        WHERE station_id = $1 AND status = 'waiting'
          AND slot_start = $2 AND slot_end = $3`,
      [stationId, slotStart, slotEnd]
    );

    await client.query("COMMIT");

    emitQueueUpdate(stationId, {
      queue_length: queueCountResult.rows[0].queue_length,
    });

    return res.status(201).json({
      message: "Added to waiting queue",
      queue_entry: insertResult.rows[0],
      queue_length: queueCountResult.rows[0].queue_length,
    });
  } catch (err) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    // Unique constraint violation → already in queue
    if (err.code === "23505") {
      return res.status(409).json({
        message: "You are already in the queue for this station and time slot",
      });
    }
    console.error("[queue] joinQueue error:", err.message);
    return res.status(500).json({ message: "Server error while joining queue" });
  } finally {
    if (client) client.release();
  }
};

/**
 * DELETE /api/queue/:stationId/leave
 * Authenticated user leaves the waiting queue.
 */
const leaveQueue = async (req, res) => {
  const userId = req.user.id;
  const stationId = toPositiveInteger(req.params.stationId);

  if (!stationId) {
    return res.status(400).json({ message: "Station id must be a positive integer" });
  }

  const bookingWindow = buildBookingWindow(req.body);
  if (bookingWindow.error) {
    return res.status(400).json({ message: bookingWindow.error });
  }

  const { slot_start: slotStart, slot_end: slotEnd } = bookingWindow.value;
  let client;

  try {
    client = await pool.connect();

    const result = await client.query(
      `UPDATE waiting_queue
          SET status = 'cancelled'
        WHERE user_id    = $1
          AND station_id = $2
          AND slot_start = $3
          AND slot_end   = $4
          AND status     = 'waiting'
       RETURNING id`,
      [userId, stationId, slotStart, slotEnd]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No active queue entry found for this station and time slot",
      });
    }

    // Broadcast updated queue length
    const queueCountResult = await client.query(
      `SELECT COUNT(*)::int AS queue_length
         FROM waiting_queue
        WHERE station_id = $1 AND status = 'waiting'
          AND slot_start = $2 AND slot_end = $3`,
      [stationId, slotStart, slotEnd]
    );
    emitQueueUpdate(stationId, {
      queue_length: queueCountResult.rows[0].queue_length,
    });

    return res.status(200).json({ message: "Removed from waiting queue" });
  } catch (err) {
    console.error("[queue] leaveQueue error:", err.message);
    return res.status(500).json({ message: "Server error while leaving queue" });
  } finally {
    if (client) client.release();
  }
};

/**
 * GET /api/queue/:stationId/status
 * Returns the current queue length and the user's own position (if any).
 */
const getQueueStatus = async (req, res) => {
  const userId = req.user.id;
  const stationId = toPositiveInteger(req.params.stationId);

  if (!stationId) {
    return res.status(400).json({ message: "Station id must be a positive integer" });
  }

  const bookingWindow = buildBookingWindow(req.query);
  if (bookingWindow.error) {
    return res.status(400).json({ message: bookingWindow.error });
  }

  const { slot_start: slotStart, slot_end: slotEnd } = bookingWindow.value;

  try {
    // Rank all waiting entries by created_at to determine position
    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'waiting')::int AS queue_length,
         MIN(CASE WHEN user_id = $3 AND status = 'waiting'
               THEN rank END) AS your_position
       FROM (
         SELECT user_id, status,
                RANK() OVER (ORDER BY created_at ASC) AS rank
           FROM waiting_queue
          WHERE station_id = $1
            AND slot_start = $2
            AND slot_end   = $4
            AND status     = 'waiting'
       ) ranked`,
      [stationId, slotStart, userId, slotEnd]
    );

    const { queue_length, your_position } = result.rows[0];
    return res.status(200).json({
      station_id: stationId,
      slot_start: slotStart,
      slot_end: slotEnd,
      queue_length: queue_length ?? 0,
      your_position: your_position ?? null,
    });
  } catch (err) {
    console.error("[queue] getQueueStatus error:", err.message);
    return res.status(500).json({ message: "Server error while fetching queue status" });
  }
};

module.exports = { joinQueue, leaveQueue, getQueueStatus };
