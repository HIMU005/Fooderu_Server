const {
  createRestaurant,
  getAllRestaurants,
} = require("../controllers/restaurantController");
const {
  createMenuItemController,
  getAllItemsUnderARestaurant,
} = require("../controllers/menuItemController");

const router = require("express").Router({ mergeParams: true });

// get all restaurant
router.get("/", getAllRestaurants);

// POST /restaurants/:restaurantId/items
router.post("/:restaurantId/items", createMenuItemController);

// get all restaurant items
router.get("/:restaurantId/items", getAllItemsUnderARestaurant);

// POST /restaurants
router.post("/", createRestaurant);

module.exports = router;
