const test = require("node:test");
const assert = require("node:assert/strict");
const pool = require("../src/config/db");
const {
  getVendorBookings,
  updateBookingStatus,
  cancelBooking,
} = require("../src/controllers/booking.controller");

const originalQuery = pool.query;

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
});

test.afterEach(() => {
  pool.query = originalQuery;
});

test("rejects vendor attempts to move bookings back to booked", async () => {
  let queryCalled = false;
  pool.query = async () => {
    queryCalled = true;
    return { rows: [] };
  };

  const req = {
    user: { id: "7" },
    params: { id: "3" },
    body: { status: "booked" },
  };
  const res = createResponse();

  await updateBookingStatus(req, res);

  assert.equal(queryCalled, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "Status must be completed or cancelled");
});

test("rejects non-numeric booking ids before querying the database", async () => {
  let queryCalled = false;
  pool.query = async () => {
    queryCalled = true;
    return { rows: [] };
  };

  const req = {
    user: { id: "7" },
    params: { id: "BOOKING_ID" },
    body: { status: "completed" },
  };
  const res = createResponse();

  await updateBookingStatus(req, res);

  assert.equal(queryCalled, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "Booking id must be a positive integer");
});

test("vendor status updates only affect active bookings owned by that vendor", async () => {
  let capturedQuery = null;
  let capturedParams = null;

  pool.query = async (query, params) => {
    capturedQuery = query;
    capturedParams = params;
    return {
      rows: [{ id: 3, user_id: 1, station_id: 2, status: "completed" }],
    };
  };

  const req = {
    user: { id: "7" },
    params: { id: "3" },
    body: { status: "completed" },
  };
  const res = createResponse();

  await updateBookingStatus(req, res);

  assert.match(capturedQuery, /station\.vendor_id = \$3/);
  assert.match(capturedQuery, /booking\.status = 'booked'/);
  assert.match(capturedQuery, /completed_at = CASE/);
  assert.deepEqual(capturedParams, ["completed", 3, "7"]);
  assert.equal(res.statusCode, 200);
});

test("users can cancel only their own active bookings", async () => {
  let capturedQuery = null;
  let capturedParams = null;

  pool.query = async (query, params) => {
    capturedQuery = query;
    capturedParams = params;
    return {
      rows: [{ id: 3, user_id: 1, station_id: 2, status: "cancelled" }],
    };
  };

  const req = {
    user: { id: "1" },
    params: { id: "3" },
  };
  const res = createResponse();

  await cancelBooking(req, res);

  assert.match(capturedQuery, /user_id = \$2/);
  assert.match(capturedQuery, /status = 'booked'/);
  assert.match(capturedQuery, /cancelled_at = NOW\(\)/);
  assert.deepEqual(capturedParams, [3, "1"]);
  assert.equal(res.statusCode, 200);
});

test("vendors can list bookings for their stations", async () => {
  let capturedQuery = null;
  let capturedParams = null;

  pool.query = async (query, params) => {
    capturedQuery = query;
    capturedParams = params;
    return {
      rows: [
        {
          id: 6,
          user_id: 3,
          user_name: "Test User",
          station_id: 4,
          station_name: "Vendor2 EV Station",
          status: "booked",
        },
      ],
    };
  };

  const req = {
    user: { id: "2" },
    query: { status: "booked" },
  };
  const res = createResponse();

  await getVendorBookings(req, res);

  assert.match(capturedQuery, /stations\.vendor_id = \$1/);
  assert.match(capturedQuery, /bookings\.status = \$2/);
  assert.deepEqual(capturedParams, ["2", "booked"]);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.bookings.length, 1);
});
