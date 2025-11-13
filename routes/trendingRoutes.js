const router = require("express").Router({ mergeParams: true });
const {
  getTrendingRestaurants,
  getTrendingPosts,
} = require("../controllers/trendingController");
const { protect } = require("../middlewares/authMiddleware");

// Get all restaurants on Trending
// /trendings
router.get("/", protect, getTrendingRestaurants);
// Get trending menu items
router.get("/posts", getTrendingPosts);

module.exports = router;
