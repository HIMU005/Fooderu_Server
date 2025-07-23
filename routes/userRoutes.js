const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const userController = require("../controllers/userController");

// Protected routes
router.get("/me", protect, userController.getUserProfile);

module.exports = router;
