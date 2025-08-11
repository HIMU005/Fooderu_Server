const {
  createRestaurant,
  getAllRestaurants,
  getRestaurant,
  getARestaurantByTheOwerId,
  followController,
  unfollowRestaurant,
  getAllRestaurant,
} = require("../controllers/restaurantController");
const {
  createMenuItemController,
  getAllItemsUnderARestaurant,
} = require("../controllers/menuItemController");
const { protect } = require("../middlewares/authMiddleware");

const router = require("express").Router({ mergeParams: true });

// get all restaurant items
router.get("/:restaurantId/items", getAllItemsUnderARestaurant);
router.get("/:restaurantId", getRestaurant);
router.get("/", getAllRestaurant);

router.get("/byUserId/:ownerId", getARestaurantByTheOwerId);

// get all restaurant
router.get("/", getAllRestaurants);

// POST /restaurants/:restaurantId/items
router.post("/:restaurantId/items", createMenuItemController);
router.post("/:restaurantId/follows", protect, followController);
router.post("/:restaurantId/unFollows", protect, unfollowRestaurant);

// POST /restaurants
router.post("/", createRestaurant);

module.exports = router;
