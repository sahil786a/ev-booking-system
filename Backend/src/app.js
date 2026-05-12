const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/auth.routes");
const stationRoutes = require("./routes/station.routes");
const bookingRoutes = require("./routes/booking.routes");
const queueRoutes = require("./routes/queue.routes");
const arrivalRoutes = require("./routes/arrival.routes");

const app = express();

app.disable("x-powered-by");

// ── Security headers (CSP, HSTS, etc.) ──
app.use(helmet());

// ── Auth rate limiter: 20 requests per 15 minutes per IP ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests — please try again in 15 minutes" },
});

// In production set CORS_ORIGIN to your actual client origins (comma-separated).
// Defaulting to "*" (explicit string) rather than `true` so it is obvious
// when the env var is not configured.
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : "*";

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

app.use("/api/auth", authLimiter, authRoutes);
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
