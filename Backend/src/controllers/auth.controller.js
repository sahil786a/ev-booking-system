const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { ROLES } = require("../constants/roles");

const SALT_ROUNDS = 12;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const normalizeText = (value) => String(value || "").trim();
const isValidPassword = (password) =>
  typeof password === "string" && password.length >= 8;

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return process.env.JWT_SECRET;
};

const getJwtIssuer = () => process.env.JWT_ISSUER || "ev-booking-api";

const signAccessToken = (account, role) =>
  jwt.sign(
    {
      sub: String(account.id),
      email: account.email,
      role,
      subject_type: role.toLowerCase(),
      token_type: "access",
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      issuer: getJwtIssuer(),
    }
  );

const toPublicAccount = (account, role) => {
  const publicAccount = {
    id: account.id,
    name: account.name,
    email: account.email,
    role,
  };

  if (role === ROLES.VENDOR) {
    publicAccount.business_name = account.business_name;
    publicAccount.phone = account.phone;
  }

  return publicAccount;
};

const handleDuplicateEmail = (error, res, label) => {
  if (error.code === "23505") {
    return res.status(409).json({
      message: `${label} email already registered`,
    });
  }

  return null;
};

const registerUser = async (req, res) => {
  try {
    const name = normalizeText(req.body.name);
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "User email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email`,
      [name, email, hashedPassword, ROLES.USER]
    );

    return res.status(201).json({
      message: "User registered successfully",
      token: signAccessToken(newUser.rows[0], ROLES.USER),
      user: toPublicAccount(newUser.rows[0], ROLES.USER),
    });
  } catch (error) {
    const duplicateResponse = handleDuplicateEmail(error, res, "User");
    if (duplicateResponse) return duplicateResponse;

    return res.status(500).json({
      message: "Server error while registering user",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const userResult = await pool.query(
      "SELECT id, name, email, password FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = userResult.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    return res.status(200).json({
      message: "User login successful",
      token: signAccessToken(user, ROLES.USER),
      user: toPublicAccount(user, ROLES.USER),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while logging in user",
    });
  }
};

const registerVendor = async (req, res) => {
  try {
    const name = normalizeText(req.body.name);
    const businessName = normalizeText(
      req.body.business_name || req.body.businessName
    );
    const email = normalizeEmail(req.body.email);
    const phone = normalizeText(req.body.phone);
    const { password } = req.body;

    if (!name || !businessName || !email || !phone || !password) {
      return res.status(400).json({
        message: "Name, business_name, email, phone, and password are required",
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    const existingVendor = await pool.query(
      "SELECT id FROM vendors WHERE email = $1",
      [email]
    );

    if (existingVendor.rows.length > 0) {
      return res.status(409).json({
        message: "Vendor email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newVendor = await pool.query(
      `INSERT INTO vendors (name, business_name, email, phone, password, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, business_name, email, phone`,
      [name, businessName, email, phone, hashedPassword, ROLES.VENDOR]
    );

    return res.status(201).json({
      message: "Vendor registered successfully",
      token: signAccessToken(newVendor.rows[0], ROLES.VENDOR),
      vendor: toPublicAccount(newVendor.rows[0], ROLES.VENDOR),
    });
  } catch (error) {
    const duplicateResponse = handleDuplicateEmail(error, res, "Vendor");
    if (duplicateResponse) return duplicateResponse;

    return res.status(500).json({
      message: "Server error while registering vendor",
    });
  }
};

const loginVendor = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const vendorResult = await pool.query(
      `SELECT id, name, business_name, email, phone, password
       FROM vendors
       WHERE email = $1`,
      [email]
    );

    if (vendorResult.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const vendor = vendorResult.rows[0];
    const isPasswordValid = await bcrypt.compare(password, vendor.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    return res.status(200).json({
      message: "Vendor login successful",
      token: signAccessToken(vendor, ROLES.VENDOR),
      vendor: toPublicAccount(vendor, ROLES.VENDOR),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while logging in vendor",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  registerVendor,
  loginVendor,
};
