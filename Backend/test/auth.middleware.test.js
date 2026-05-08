const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const {
  authenticate,
  authorizeRoles,
} = require("../src/middleware/auth.middleware");
const { ROLES } = require("../src/constants/roles");

process.env.JWT_SECRET = "test-secret";
process.env.JWT_ISSUER = "ev-booking-api";

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

const runMiddleware = (middleware, req) => {
  const res = createResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  return { req, res, nextCalled };
};

const signToken = (claims) =>
  jwt.sign(claims, process.env.JWT_SECRET, {
    expiresIn: "1h",
    issuer: process.env.JWT_ISSUER,
  });

const requestWithToken = (token) => ({
  headers: {
    authorization: `Bearer ${token}`,
  },
});

test("authenticates a valid USER token and exposes role claims", () => {
  const token = signToken({
    sub: "1",
    email: "user@example.com",
    role: ROLES.USER,
    subject_type: "user",
    token_type: "access",
  });

  const result = runMiddleware(authenticate, requestWithToken(token));

  assert.equal(result.nextCalled, true);
  assert.equal(result.req.user.id, "1");
  assert.equal(result.req.user.role, ROLES.USER);
});

test("rejects requests without a bearer token", () => {
  const result = runMiddleware(authenticate, { headers: {} });

  assert.equal(result.nextCalled, false);
  assert.equal(result.res.statusCode, 401);
});

test("rejects tokens without a valid role claim", () => {
  const token = signToken({
    sub: "1",
    email: "user@example.com",
    token_type: "access",
  });

  const result = runMiddleware(authenticate, requestWithToken(token));

  assert.equal(result.nextCalled, false);
  assert.equal(result.res.statusCode, 401);
});

test("blocks USER tokens from VENDOR routes", () => {
  const token = signToken({
    sub: "1",
    email: "user@example.com",
    role: ROLES.USER,
    subject_type: "user",
    token_type: "access",
  });
  const req = requestWithToken(token);

  assert.equal(runMiddleware(authenticate, req).nextCalled, true);

  const result = runMiddleware(authorizeRoles(ROLES.VENDOR), req);

  assert.equal(result.nextCalled, false);
  assert.equal(result.res.statusCode, 403);
});

test("blocks VENDOR tokens from USER routes", () => {
  const token = signToken({
    sub: "9",
    email: "vendor@example.com",
    role: ROLES.VENDOR,
    subject_type: "vendor",
    token_type: "access",
  });
  const req = requestWithToken(token);

  assert.equal(runMiddleware(authenticate, req).nextCalled, true);

  const result = runMiddleware(authorizeRoles(ROLES.USER), req);

  assert.equal(result.nextCalled, false);
  assert.equal(result.res.statusCode, 403);
});

test("allows VENDOR tokens through VENDOR routes", () => {
  const token = signToken({
    sub: "9",
    email: "vendor@example.com",
    role: ROLES.VENDOR,
    subject_type: "vendor",
    token_type: "access",
  });
  const req = requestWithToken(token);

  assert.equal(runMiddleware(authenticate, req).nextCalled, true);

  const result = runMiddleware(authorizeRoles(ROLES.VENDOR), req);

  assert.equal(result.nextCalled, true);
});
