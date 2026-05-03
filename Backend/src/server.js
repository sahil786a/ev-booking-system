const app = require("./app");
const pool = require("./config/db");

const PORT = 5000;

pool.connect()
  .then(() => {
    console.log("Database Connected ✅");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB Connection Error ❌", err);
  });