const router = require("express").Router({ mergeParams: true });
const {
  createMenuItemController,
} = require("../controllers/menuItemController");

// POST /restaurants/:restaurantId/items
router.post("/items", createMenuItemController);

module.exports = router;
