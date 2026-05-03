const express = require("express");
const router = express.Router();

const { createStation } = require("../controllers/station.controller");

router.post("/", createStation);

module.exports = router;