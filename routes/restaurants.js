const {
  createRestaurant,
  getAllRestaurants,
  getRestaurant,
  getARestaurantByTheOwerId,
  getAllRestaurant,
  getRestaurantsWithFollowStatus,
  updateMyRestaurant,
} = require("../controllers/restaurantController");
const {
  createMenuItemController,
  getAllItemsUnderARestaurant,
  getAllPostsUnderARestaurant,
} = require("../controllers/menuItemController");

const { protect } = require("../middlewares/authMiddleware");

const router = require("express").Router({ mergeParams: true });

// POST /restaurants
router.post("/", protect, createRestaurant);

// POST /restaurants/:restaurantId/items
router.post("/:restaurantId/items", protect, createMenuItemController);

router.get("/follow-status", protect, getRestaurantsWithFollowStatus);

router.get("/:restaurantId/posts", protect, getAllPostsUnderARestaurant);

// get all restaurant items
router.get("/:restaurantId/items", protect, getAllItemsUnderARestaurant);
router.get("/:restaurantId", protect, getRestaurant);
router.put("/:restaurantId", protect, updateMyRestaurant);

router.get("/byUserId/:ownerId", protect, getARestaurantByTheOwerId);

// get all restaurant
router.get("/", protect, getAllRestaurants);

module.exports = router;
