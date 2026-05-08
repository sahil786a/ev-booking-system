const test = require("node:test");
const assert = require("node:assert/strict");
const pool = require("../src/config/db");
const {
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
  assert.deepEqual(capturedParams, ["completed", "3", "7"]);
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
  assert.deepEqual(capturedParams, ["3", "1"]);
  assert.equal(res.statusCode, 200);
});
