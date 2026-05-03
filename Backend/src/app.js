const express = require("express");
const cors = require("cors");
const stationRoutes = require("./routes/station.routes");
const app = express();



app.use(cors());
app.use(express.json());
app.use("/stations", stationRoutes);

app.get("/", (req, res) => {
  res.send("API Running System chal gya ");
});

module.exports = app;