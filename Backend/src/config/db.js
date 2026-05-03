const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "ev_db",
  password: "786786",   // ← jo tune install time set kiya tha
  port: 5432,
});

module.exports = pool;