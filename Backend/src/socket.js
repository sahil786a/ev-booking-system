const { Server } = require("socket.io");

/** @type {import("socket.io").Server | null} */
let _io = null;

/**
 * Initialise Socket.IO against an http.Server instance.
 * Must be called once from server.js before any emits.
 *
 * @param {import("http").Server} httpServer
 * @returns {import("socket.io").Server}
 */
function initSocket(httpServer) {
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : "*";

  _io = new Server(httpServer, {
    cors: { origin: corsOrigin, methods: ["GET", "POST"] },
    // Reconnection happens client-side; keep server-side ping tight.
    pingTimeout: 20_000,
    pingInterval: 25_000,
  });

  _io.on("connection", (socket) => {
    // ── Room management ───────────────────────────────────────
    // Clients subscribe to individual station rooms so they only
    // receive events relevant to the station they are viewing.
    socket.on("subscribe_station", (stationId) => {
      const room = `station:${stationId}`;
      socket.join(room);
    });

    socket.on("unsubscribe_station", (stationId) => {
      socket.leave(`station:${stationId}`);
    });

    socket.on("disconnect", () => {
      // rooms are auto-cleaned by Socket.IO on disconnect
    });
  });

  return _io;
}

/**
 * Return the active Socket.IO server instance.
 * Callers must guard against null (server not yet initialised).
 *
 * @returns {import("socket.io").Server | null}
 */
function getIo() {
  return _io;
}

/**
 * Broadcast a slot-availability change for a station.
 * Safe to call even before Socket.IO is initialised (no-ops).
 *
 * @param {number|string} stationId
 * @param {{ available_slots: number, total_slots: number }} payload
 */
function emitSlotUpdate(stationId, payload) {
  if (!_io) return;
  _io.to(`station:${stationId}`).emit("slot_update", {
    station_id: stationId,
    ...payload,
    ts: Date.now(),
  });
}

/**
 * Broadcast a waiting-queue position change for a station.
 *
 * @param {number|string} stationId
 * @param {{ queue_length: number }} payload
 */
function emitQueueUpdate(stationId, payload) {
  if (!_io) return;
  _io.to(`station:${stationId}`).emit("queue_update", {
    station_id: stationId,
    ...payload,
    ts: Date.now(),
  });
}

module.exports = { initSocket, getIo, emitSlotUpdate, emitQueueUpdate };
