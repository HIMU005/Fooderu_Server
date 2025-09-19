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
} = require("../controllers/menuItemController");

const { protect } = require("../middlewares/authMiddleware");

const router = require("express").Router({ mergeParams: true });

router.get("/follow-status", protect, getRestaurantsWithFollowStatus);

// get all restaurant items
router.get("/:restaurantId/items", getAllItemsUnderARestaurant);
router.get("/:restaurantId", getRestaurant);
router.put("/:restaurantId", protect, updateMyRestaurant);

router.get("/byUserId/:ownerId", getARestaurantByTheOwerId);

// get all restaurant
router.get("/", getAllRestaurants);

// POST /restaurants/:restaurantId/items
router.post("/:restaurantId/items", createMenuItemController);

// POST /restaurants
router.post("/", createRestaurant);

module.exports = router;
