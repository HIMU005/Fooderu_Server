const {
  createRestaurant,
  getAllRestaurants,
  getRestaurant,
  getARestaurantByTheOwerId,
} = require("../controllers/restaurantController");
const {
  createMenuItemController,
  getAllItemsUnderARestaurant,
} = require("../controllers/menuItemController");

const router = require("express").Router({ mergeParams: true });

// get all restaurant items
router.get("/:restaurantId/items", getAllItemsUnderARestaurant);
router.get("/:restaurantId", getRestaurant);

router.get("/byUserId/:ownerId", getARestaurantByTheOwerId);

// get all restaurant
router.get("/", getAllRestaurants);

// POST /restaurants/:restaurantId/items
router.post("/:restaurantId/items", createMenuItemController);

// POST /restaurants
router.post("/", createRestaurant);

module.exports = router;
