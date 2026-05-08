const fs = require("fs");
const path = require("path");
const pool = require("../src/config/db");

const migrationsDir = path.join(__dirname, "..", "migrations");

const runMigrations = async () => {
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  if (migrationFiles.length === 0) {
    console.log("No migration files found");
    return;
  }

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf8");

    console.log(`Running migration: ${file}`);
    await pool.query(sql);
  }

  console.log("Migrations completed successfully");
};

runMigrations()
  .catch((error) => {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
