const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const stationRoutes = require("./routes/station.routes");
const bookingRoutes = require("./routes/booking.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "EV Booking System Backend is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/stations", stationRoutes);
app.use("/api/bookings", bookingRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.use((error, req, res, next) => {
  res.status(500).json({
    message: "Internal server error",
  });
});

module.exports = app;
