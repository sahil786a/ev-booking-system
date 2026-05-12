/**
 * Admin Seeder
 * ------------
 * Creates or updates a single admin account from environment variables.
 *
 * Usage:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=supersecret ADMIN_NAME="Admin" node scripts/seed-admin.js
 *
 * Or add to .env and run:
 *   node scripts/seed-admin.js
 */

require("dotenv").config();
const bcrypt = require("bcrypt");
const pool = require("../src/config/db");

const SALT_ROUNDS = 12;

async function seedAdmin() {
  const name = (process.env.ADMIN_NAME || "").trim();
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";

  if (!name || !email || !password) {
    console.error(
      "Error: ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must all be set."
    );
    process.exitCode = 1;
    return;
  }

  if (password.length < 8) {
    console.error("Error: ADMIN_PASSWORD must be at least 8 characters.");
    process.exitCode = 1;
    return;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO admins (name, email, password, role)
     VALUES ($1, $2, $3, 'ADMIN')
     ON CONFLICT (email)
     DO UPDATE SET name = EXCLUDED.name,
                   password = EXCLUDED.password
     RETURNING id, name, email, role`,
    [name, email, hashedPassword]
  );

  const admin = result.rows[0];
  console.log(
    `Admin seeded successfully: [id=${admin.id}] ${admin.name} <${admin.email}> (${admin.role})`
  );
}

seedAdmin()
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
