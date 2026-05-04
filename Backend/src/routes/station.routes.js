const express = require("express");
const {
  addStation,
  getAllStations,
  getStationById,
  updateStation,
  deleteStation,
} = require("../controllers/station.controller");
const protect = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", protect, addStation);
router.get("/", getAllStations);
router.get("/:id", getStationById);
router.put("/:id", protect, updateStation);
router.delete("/:id", protect, deleteStation);

module.exports = router;
