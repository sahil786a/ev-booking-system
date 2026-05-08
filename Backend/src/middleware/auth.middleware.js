const jwt = require("jsonwebtoken");
const { ROLE_VALUES, ROLES } = require("../constants/roles");

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return process.env.JWT_SECRET;
};

const getJwtIssuer = () => process.env.JWT_ISSUER || "ev-booking-api";

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers?.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, getJwtSecret(), {
      issuer: getJwtIssuer(),
    });

    if (!decoded.sub || !decoded.role || !ROLE_VALUES.includes(decoded.role)) {
      return res.status(401).json({
        message: "Invalid token claims",
      });
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      subject_type: decoded.subject_type,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

const authorizeRoles =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden. You do not have permission to access this route",
      });
    }

    next();
  };

const requireUser = [authenticate, authorizeRoles(ROLES.USER)];
const requireVendor = [authenticate, authorizeRoles(ROLES.VENDOR)];
const requireAdmin = [authenticate, authorizeRoles(ROLES.ADMIN)];

module.exports = {
  authenticate,
  authorizeRoles,
  requireUser,
  requireVendor,
  requireAdmin,
};
