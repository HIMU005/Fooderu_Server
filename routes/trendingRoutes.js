const router = require("express").Router({ mergeParams: true });
const {
  getTrendingRestaurants,
  getTrendingPostItems,
  getTrendingPosts,
} = require("../controllers/trendingController");
const { protect } = require("../middlewares/authMiddleware");

// Get all restaurants on Trending
// /trendings
router.get("/", protect, getTrendingRestaurants);
// Get trending menu items
router.get("/posts", protect, getTrendingPosts);

// Get treending posts and items
router.get("/postItems", protect, getTrendingPostItems);

module.exports = router;
