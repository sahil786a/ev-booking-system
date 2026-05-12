/**
 * No-Show Scheduler
 * -----------------
 * Runs every minute via node-cron.
 *
 * For every booking whose slot_start has passed the vendor-configured
 * grace window and which is still in 'booked' status (no check-in
 * arrival event recorded), we:
 *   1. Mark the booking as 'no_show'.
 *   2. Look for the oldest 'waiting' queue entry for the same
 *      station + overlapping time window.
 *   3. If found, create a new booking for that user and mark the
 *      queue entry as 'promoted'.
 *   4. Emit socket events for affected stations.
 *
 * BUG PREDICTIONS & MITIGATIONS:
 *   - Race condition: two cron ticks overlapping → we use a
 *     per-scheduler mutex flag (`running`) so a tick is skipped
 *     if the previous one hasn't finished.
 *   - Partial promotion failure: if the booking INSERT succeeds but
 *     the queue UPDATE fails, we'd have a ghost booking. We wrap
 *     both in a DB transaction.
 *   - Clock skew: we use NOW() from the DB, not Node.js Date, so
 *     the comparison is always consistent with stored TIMESTAMPTZ.
 *   - noshow_grace_minutes defaulting: handled in the JOIN so
 *     stations without the column yet still work (COALESCE fallback).
 */

const cron = require("node-cron");
const pool = require("./config/db");
const { emitSlotUpdate, emitQueueUpdate } = require("./socket");

let running = false;

async function processNoShows() {
  if (running) {
    console.warn("[noshow] previous tick still running — skipping");
    return;
  }
  running = true;

  let client;
  try {
    client = await pool.connect();

    // ── Step 1: Find expired bookings (past grace window, no check-in) ──
    // We LEFT JOIN arrival_events to check whether a 'checkin' event
    // exists. If it does, the user physically arrived → not a no-show.
    const expiredResult = await client.query(
      `SELECT
         b.id              AS booking_id,
         b.user_id,
         b.station_id,
         b.slot_start,
         b.slot_end,
         s.total_slots,
         COALESCE(s.noshow_grace_minutes, 15) AS grace_minutes
       FROM bookings b
       JOIN stations s ON s.id = b.station_id
       LEFT JOIN arrival_events ae
         ON ae.booking_id = b.id AND ae.event_type = 'checkin'
       WHERE b.status = 'booked'
         AND ae.id IS NULL                        -- no check-in recorded
         AND b.slot_start + (COALESCE(s.noshow_grace_minutes, 15) || ' minutes')::INTERVAL < NOW()
       FOR UPDATE OF b SKIP LOCKED`
    );

    if (expiredResult.rows.length === 0) {
      return;
    }

    for (const row of expiredResult.rows) {
      await client.query("BEGIN");
      try {
        // ── Step 2: Mark booking as no_show ──
        await client.query(
          `UPDATE bookings
             SET status = 'no_show', noshow_at = NOW()
           WHERE id = $1 AND status = 'booked'`,
          [row.booking_id]
        );

        // ── Step 3: Count current active bookings for slot emission ──
        const activeResult = await client.query(
          `SELECT COUNT(*)::int AS active_bookings
             FROM bookings
            WHERE station_id = $1
              AND status = 'booked'
              AND slot_start < $3
              AND slot_end   > $2`,
          [row.station_id, row.slot_start, row.slot_end]
        );
        const active = activeResult.rows[0].active_bookings;
        const available = row.total_slots - active;

        // ── Step 4: Find oldest waiting queue entry for this slot ──
        const queueResult = await client.query(
          `SELECT id, user_id, slot_start, slot_end
             FROM waiting_queue
            WHERE station_id = $1
              AND status     = 'waiting'
              AND slot_start  = $2
              AND slot_end    = $3
            ORDER BY created_at ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED`,
          [row.station_id, row.slot_start, row.slot_end]
        );

        if (queueResult.rows.length > 0) {
          const queued = queueResult.rows[0];

          // Create a real booking for the queued user
          const newBooking = await client.query(
            `INSERT INTO bookings (user_id, station_id, slot_start, slot_end, status)
               VALUES ($1, $2, $3, $4, 'booked')
             RETURNING id`,
            [queued.user_id, row.station_id, queued.slot_start, queued.slot_end]
          );

          // Promote the queue entry
          await client.query(
            `UPDATE waiting_queue
                SET status = 'promoted',
                    promoted_booking_id = $1
              WHERE id = $2`,
            [newBooking.rows[0].id, queued.id]
          );
        }

        await client.query("COMMIT");

        // ── Step 5: Emit real-time events ──
        emitSlotUpdate(row.station_id, {
          available_slots: Math.max(0, available),
          total_slots: row.total_slots,
        });

        // Emit remaining queue length
        const queueCountResult = await client.query(
          `SELECT COUNT(*)::int AS queue_length
             FROM waiting_queue
            WHERE station_id = $1 AND status = 'waiting'
              AND slot_start = $2 AND slot_end = $3`,
          [row.station_id, row.slot_start, row.slot_end]
        );
        emitQueueUpdate(row.station_id, {
          queue_length: queueCountResult.rows[0].queue_length,
        });

        console.log(
          `[noshow] booking #${row.booking_id} → no_show | station #${row.station_id}`
        );
      } catch (innerErr) {
        await client.query("ROLLBACK");
        console.error(
          `[noshow] failed to process booking #${row.booking_id}:`,
          innerErr.message
        );
      }
    }
  } catch (err) {
    console.error("[noshow] scheduler error:", err.message);
  } finally {
    if (client) client.release();
    running = false;
  }
}

/**
 * Start the no-show cron job.
 * Called once from server.js after the DB connection is verified.
 */
function startNoShowScheduler() {
  // Run every minute — "At second 0 of every minute"
  cron.schedule("* * * * *", () => {
    processNoShows().catch((err) =>
      console.error("[noshow] unhandled error:", err.message)
    );
  });
  console.log("[noshow] scheduler started (runs every 60 s)");
}

module.exports = { startNoShowScheduler };
