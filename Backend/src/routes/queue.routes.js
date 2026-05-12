const express = require("express");
const { joinQueue, leaveQueue, getQueueStatus } = require("../controllers/queue.controller");
const { requireUser } = require("../middleware/auth.middleware");

const router = express.Router();

// GET  /api/queue/:stationId/status  — queue length + user position
router.get("/:stationId/status", ...requireUser, getQueueStatus);

// POST /api/queue/:stationId/join    — join the waiting queue
router.post("/:stationId/join", ...requireUser, joinQueue);

// DELETE /api/queue/:stationId/leave — leave the waiting queue
router.delete("/:stationId/leave", ...requireUser, leaveQueue);

module.exports = router;
