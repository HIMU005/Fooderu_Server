// routes/followRoutes.js
const express = require("express");
const router = express.Router({ mergeParams: true });
const { toggleFollow } = require("../controllers/followController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/:restaurantId/toggle", protect, toggleFollow);

module.exports = router;
