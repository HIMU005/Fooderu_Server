const { createRestaurant } = require("../controllers/restaurantController");
const {
  createMenuItemController,
} = require("../controllers/menuItemController");

const router = require("express").Router({ mergeParams: true });

// POST /restaurants/:restaurantId/items
router.post("/:restaurantId/items", createMenuItemController);

// POST /restaurants
router.post("/", createRestaurant);

module.exports = router;
