const pool = require("../config/db");

const addStation = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { name, latitude, longitude, contact, total_slots } = req.body;

    if (!name || latitude === undefined || longitude === undefined || !contact || total_slots === undefined) {
      return res.status(400).json({
        message: "Name, latitude, longitude, contact, and total_slots are required",
      });
    }

    if (total_slots <= 0) {
      return res.status(400).json({
        message: "Total slots must be greater than 0",
      });
    }

    const result = await pool.query(
      `INSERT INTO stations (vendor_id, name, latitude, longitude, contact, total_slots)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [vendorId, name, latitude, longitude, contact, total_slots]
    );

    return res.status(201).json({
      message: "Station added successfully",
      station: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while adding station",
    });
  }
};

const getAllStations = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT stations.*,
              (stations.total_slots - COUNT(bookings.id)::int) AS available_slots
       FROM stations
       LEFT JOIN bookings
         ON bookings.station_id = stations.id
        AND bookings.status = 'booked'
       GROUP BY stations.id
       ORDER BY stations.id ASC`
    );

    return res.status(200).json({
      stations: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching stations",
    });
  }
};

const getMyStations = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const result = await pool.query(
      "SELECT * FROM stations WHERE vendor_id = $1 ORDER BY id ASC",
      [vendorId]
    );

    return res.status(200).json({
      stations: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching vendor stations",
    });
  }
};

const getStationById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM stations WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Station not found",
      });
    }

    return res.status(200).json({
      station: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching station",
    });
  }
};

const updateStation = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;
    const { name, latitude, longitude, contact, total_slots } = req.body;

    if (!name || latitude === undefined || longitude === undefined || !contact || total_slots === undefined) {
      return res.status(400).json({
        message: "Name, latitude, longitude, contact, and total_slots are required",
      });
    }

    if (total_slots <= 0) {
      return res.status(400).json({
        message: "Total slots must be greater than 0",
      });
    }

    const result = await pool.query(
      `UPDATE stations
       SET name = $1, latitude = $2, longitude = $3, contact = $4, total_slots = $5
       WHERE id = $6 AND vendor_id = $7
       RETURNING *`,
      [name, latitude, longitude, contact, total_slots, id, vendorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Station not found for this vendor",
      });
    }

    return res.status(200).json({
      message: "Station updated successfully",
      station: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while updating station",
    });
  }
};

const deleteStation = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM stations WHERE id = $1 AND vendor_id = $2 RETURNING *",
      [id, vendorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Station not found for this vendor",
      });
    }

    return res.status(200).json({
      message: "Station deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while deleting station",
    });
  }
};

module.exports = {
  addStation,
  getAllStations,
  getMyStations,
  getStationById,
  updateStation,
  deleteStation,
};
