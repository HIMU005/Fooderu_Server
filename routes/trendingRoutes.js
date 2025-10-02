const router = require("express").Router({ mergeParams: true });
const {
  getTrendingRestaurants,
  getTrendingMenuItems,
} = require("../controllers/trendingController");
const { protect } = require("../middlewares/authMiddleware");

// Get all restaurants on Trending
// /trendings
router.get("/", protect, getTrendingRestaurants);
// Get trending menu items
router.get("/menu-items", protect, getTrendingMenuItems);

module.exports = router;
