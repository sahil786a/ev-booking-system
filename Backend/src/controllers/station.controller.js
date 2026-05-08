const pool = require("../config/db");

const validateStationInput = ({ name, latitude, longitude, contact, total_slots }) => {
  const normalizedName = String(name || "").trim();
  const normalizedContact = String(contact || "").trim();
  const normalizedLatitude = Number(latitude);
  const normalizedLongitude = Number(longitude);
  const normalizedTotalSlots = Number(total_slots);

  if (
    !normalizedName ||
    latitude === undefined ||
    longitude === undefined ||
    !normalizedContact ||
    total_slots === undefined
  ) {
    return {
      error: "Name, latitude, longitude, contact, and total_slots are required",
    };
  }

  if (
    !Number.isFinite(normalizedLatitude) ||
    normalizedLatitude < -90 ||
    normalizedLatitude > 90
  ) {
    return {
      error: "Latitude must be a valid number between -90 and 90",
    };
  }

  if (
    !Number.isFinite(normalizedLongitude) ||
    normalizedLongitude < -180 ||
    normalizedLongitude > 180
  ) {
    return {
      error: "Longitude must be a valid number between -180 and 180",
    };
  }

  if (!Number.isInteger(normalizedTotalSlots) || normalizedTotalSlots <= 0) {
    return {
      error: "Total slots must be a positive integer",
    };
  }

  return {
    value: {
      name: normalizedName,
      latitude: normalizedLatitude,
      longitude: normalizedLongitude,
      contact: normalizedContact,
      total_slots: normalizedTotalSlots,
    },
  };
};

const addStation = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const validation = validateStationInput(req.body);

    if (validation.error) {
      return res.status(400).json({
        message: validation.error,
      });
    }

    const { name, latitude, longitude, contact, total_slots } = validation.value;

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

    const result = await pool.query(
      `SELECT stations.*,
              COUNT(bookings.id)::int AS booked_slots,
              (stations.total_slots - COUNT(bookings.id)::int) AS available_slots
       FROM stations
       LEFT JOIN bookings
         ON bookings.station_id = stations.id
        AND bookings.status = 'booked'
       WHERE stations.id = $1
       GROUP BY stations.id`,
      [id]
    );

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

const getStationAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT stations.id,
              stations.name,
              stations.total_slots,
              COUNT(bookings.id)::int AS booked_slots,
              (stations.total_slots - COUNT(bookings.id)::int) AS available_slots
       FROM stations
       LEFT JOIN bookings
         ON bookings.station_id = stations.id
        AND bookings.status = 'booked'
       WHERE stations.id = $1
       GROUP BY stations.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Station not found",
      });
    }

    return res.status(200).json({
      availability: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching station availability",
    });
  }
};

const updateStation = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;
    const validation = validateStationInput(req.body);

    if (validation.error) {
      return res.status(400).json({
        message: validation.error,
      });
    }

    const { name, latitude, longitude, contact, total_slots } = validation.value;

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
  getStationAvailability,
  updateStation,
  deleteStation,
};
