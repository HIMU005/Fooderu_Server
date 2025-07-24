const {
  createRestaurant,
  getAllRestaurants,
} = require("../controllers/restaurantController");
const {
  createMenuItemController,
} = require("../controllers/menuItemController");

const router = require("express").Router({ mergeParams: true });

// get all restaurant
router.get("/", getAllRestaurants);

// POST /restaurants/:restaurantId/items
router.post("/:restaurantId/items", createMenuItemController);

// POST /restaurants
router.post("/", createRestaurant);

module.exports = router;
