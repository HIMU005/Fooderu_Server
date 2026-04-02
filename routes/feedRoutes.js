// routes/followRoutes.js
const express = require("express");
const router = express.Router({ mergeParams: true });
const { protect } = require("../middlewares/authMiddleware");
const { getAllFeeds } = require("../controllers/feedController");

router.get("/", protect, getAllFeeds);

module.exports = router;
