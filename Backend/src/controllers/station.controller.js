const pool = require("../config/db");
const {
  buildBookingWindow,
  toPositiveInteger,
} = require("../utils/validation");

const validateStationInput = ({
  name,
  latitude,
  longitude,
  contact,
  total_slots,
}) => {
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

    const { name, latitude, longitude, contact, total_slots } =
      validation.value;

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
    const bookingWindow = buildBookingWindow(req.query);

    if (bookingWindow.error) {
      return res.status(400).json({
        message: bookingWindow.error,
      });
    }

    const { slot_start: slotStart, slot_end: slotEnd } = bookingWindow.value;

    const result = await pool.query(
      `SELECT stations.*,
              COUNT(bookings.id)::int AS booked_slots,
              (stations.total_slots - COUNT(bookings.id)::int) AS available_slots
       FROM stations
       LEFT JOIN bookings
         ON bookings.station_id = stations.id
        AND bookings.status = 'booked'
        AND bookings.slot_start < $2
        AND bookings.slot_end > $1
       WHERE stations.is_active = TRUE
         AND stations.vendor_id IS NOT NULL
       GROUP BY stations.id
       ORDER BY stations.id ASC`,
      [slotStart, slotEnd]
    );

    return res.status(200).json({
      availability_window: {
        slot_start: slotStart,
        slot_end: slotEnd,
      },
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
      `SELECT *
       FROM stations
       WHERE vendor_id = $1 AND is_active = TRUE
       ORDER BY id ASC`,
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
    const stationId = toPositiveInteger(req.params.id);

    if (!stationId) {
      return res.status(400).json({
        message: "Station id must be a positive integer",
      });
    }

    const bookingWindow = buildBookingWindow(req.query);

    if (bookingWindow.error) {
      return res.status(400).json({
        message: bookingWindow.error,
      });
    }

    const { slot_start: slotStart, slot_end: slotEnd } = bookingWindow.value;

    const result = await pool.query(
      `SELECT stations.*,
              COUNT(bookings.id)::int AS booked_slots,
              (stations.total_slots - COUNT(bookings.id)::int) AS available_slots
       FROM stations
       LEFT JOIN bookings
         ON bookings.station_id = stations.id
        AND bookings.status = 'booked'
        AND bookings.slot_start < $3
        AND bookings.slot_end > $2
       WHERE stations.id = $1
         AND stations.is_active = TRUE
       GROUP BY stations.id`,
      [stationId, slotStart, slotEnd]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Station not found",
      });
    }

    return res.status(200).json({
      availability_window: {
        slot_start: slotStart,
        slot_end: slotEnd,
      },
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
    const stationId = toPositiveInteger(req.params.id);

    if (!stationId) {
      return res.status(400).json({
        message: "Station id must be a positive integer",
      });
    }

    const bookingWindow = buildBookingWindow(req.query);

    if (bookingWindow.error) {
      return res.status(400).json({
        message: bookingWindow.error,
      });
    }

    const { slot_start: slotStart, slot_end: slotEnd } = bookingWindow.value;

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
        AND bookings.slot_start < $3
        AND bookings.slot_end > $2
       WHERE stations.id = $1
         AND stations.is_active = TRUE
       GROUP BY stations.id`,
      [stationId, slotStart, slotEnd]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Station not found",
      });
    }

    return res.status(200).json({
      availability_window: {
        slot_start: slotStart,
        slot_end: slotEnd,
      },
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
    const stationId = toPositiveInteger(req.params.id);
    const validation = validateStationInput(req.body);

    if (!stationId) {
      return res.status(400).json({
        message: "Station id must be a positive integer",
      });
    }

    if (validation.error) {
      return res.status(400).json({
        message: validation.error,
      });
    }

    const { name, latitude, longitude, contact, total_slots } =
      validation.value;

    const activeBookingsResult = await pool.query(
      `SELECT COUNT(*)::int AS active_bookings
       FROM bookings
       JOIN stations ON bookings.station_id = stations.id
       WHERE stations.id = $1
         AND stations.vendor_id = $2
         AND bookings.status = 'booked'`,
      [stationId, vendorId]
    );

    if (
      activeBookingsResult.rows.length > 0 &&
      activeBookingsResult.rows[0].active_bookings > total_slots
    ) {
      return res.status(409).json({
        message: "Total slots cannot be lower than existing active bookings",
      });
    }

    const result = await pool.query(
      `UPDATE stations
       SET name = $1,
           latitude = $2,
           longitude = $3,
           contact = $4,
           total_slots = $5
       WHERE id = $6
         AND vendor_id = $7
         AND is_active = TRUE
       RETURNING *`,
      [name, latitude, longitude, contact, total_slots, stationId, vendorId]
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
    const stationId = toPositiveInteger(req.params.id);

    if (!stationId) {
      return res.status(400).json({
        message: "Station id must be a positive integer",
      });
    }

    const activeBookingsResult = await pool.query(
      `SELECT COUNT(*)::int AS active_bookings
       FROM bookings
       JOIN stations ON bookings.station_id = stations.id
       WHERE stations.id = $1
         AND stations.vendor_id = $2
         AND bookings.status = 'booked'`,
      [stationId, vendorId]
    );

    if (
      activeBookingsResult.rows.length > 0 &&
      activeBookingsResult.rows[0].active_bookings > 0
    ) {
      return res.status(409).json({
        message: "Station cannot be deleted while active bookings exist",
      });
    }

    const result = await pool.query(
      `UPDATE stations
       SET is_active = FALSE
       WHERE id = $1 AND vendor_id = $2 AND is_active = TRUE
       RETURNING *`,
      [stationId, vendorId]
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
