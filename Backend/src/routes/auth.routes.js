const express = require("express");
const {
  registerUser,
  loginUser,
  registerVendor,
  loginVendor,
  refreshToken,
} = require("../controllers/auth.controller");
const { requireUser, requireVendor } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/users/register", registerUser);
router.post("/users/login", loginUser);
router.post("/vendors/register", registerVendor);
router.post("/vendors/login", loginVendor);
router.post("/refresh", refreshToken);

router.get("/users/profile", ...requireUser, (req, res) => {
  res.status(200).json({
    message: "User profile route accessed successfully",
    user: req.user,
  });
});

router.get("/vendors/profile", ...requireVendor, (req, res) => {
  res.status(200).json({
    message: "Vendor profile route accessed successfully",
    vendor: req.user,
  });
});

module.exports = router;
