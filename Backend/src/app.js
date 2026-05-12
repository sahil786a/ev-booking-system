const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const stationRoutes = require("./routes/station.routes");
const bookingRoutes = require("./routes/booking.routes");
const queueRoutes = require("./routes/queue.routes");
const arrivalRoutes = require("./routes/arrival.routes");

const app = express();

app.disable("x-powered-by");

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : true;

app.use(
  cors({
    origin: corsOrigin,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.status(200).json({
    message: "EV Booking System Backend is running",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/stations", stationRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/arrivals", arrivalRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      message: "Invalid JSON body",
    });
  }

  console.error(error);

  res.status(500).json({
    message: "Internal server error",
  });
});

module.exports = app;
