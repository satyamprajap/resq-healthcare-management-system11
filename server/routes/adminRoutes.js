const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const User = require("../models/User");

// Admin Dashboard
router.get("/", adminAuth, async (req, res) => {
  try {
    const users = await User.find();

    res.render("admin/dashboard", {
      title: "Admin Dashboard | ResQ",
      page: "admin",
      users,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).send("Unable to load admin dashboard");
  }
});

module.exports = router;
