const express = require("express");
const {
  addStation,
  getAllStations,
  getMyStations,
  getStationById,
  updateStation,
  deleteStation,
} = require("../controllers/station.controller");
const { requireVendor } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", ...requireVendor, addStation);
router.get("/", getAllStations);
router.get("/mine", ...requireVendor, getMyStations);
router.get("/:id", getStationById);
router.put("/:id", ...requireVendor, updateStation);
router.delete("/:id", ...requireVendor, deleteStation);

module.exports = router;
