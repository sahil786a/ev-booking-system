require("dotenv").config();
const http = require("http");

const app = require("./app");
const pool = require("./config/db");
const { initSocket } = require("./socket");
const { startNoShowScheduler } = require("./noshow.scheduler");

const PORT = process.env.PORT || 5000;

// Create HTTP server wrapping the Express app so Socket.IO can attach
const server = http.createServer(app);
initSocket(server);

pool
  .connect()
  .then((client) => {
    console.log("Database connected successfully");
    client.release();

    // Start background processes after DB is verified
    startNoShowScheduler();

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  });
