const pool = require("../config/db");

exports.createStation = async (req, res) => {
  try {
    const { name, latitude, longitude, contact, total_slots } = req.body;

    const result = await pool.query(
      `INSERT INTO stations (name, latitude, longitude, contact, total_slots)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, latitude, longitude, contact, total_slots]
    );

    res.status(201).json({
      message: "Station created successfully",
      data: result.rows[0],
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};