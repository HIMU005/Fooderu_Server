const router = require("express").Router({ mergeParams: true });
const { getTrendingRestaurants } = require("../controllers/trendingController");
const { protect } = require("../middlewares/authMiddleware");

// Get all restaurants on Trending
// /trendings
router.get("/", protect, getTrendingRestaurants);

module.exports = router;
