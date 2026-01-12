const express = require("express");
const {
  PostARating,
  GetASingleMenuItem,
  GetMyRating,
  getAllMenuItems,
  getMenuItemsByFollowedRestaurants,
  updateMenuItem,
  deleteMenuItem,
} = require("../controllers/menuItemController");
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();

router.get(
  "/getMenuItemsByFollowedRestaurants",
  protect,
  getMenuItemsByFollowedRestaurants
);

//post route for rating a menu item
router.post("/:menuItemId/rate", protect, PostARating);

// get a single munu item by its id
router.get("/:menuItemId", protect, GetASingleMenuItem);

// update menuItem  - the owner of the restaurant can update the menu item details
router.put("/:menuItemId", protect, updateMenuItem);

// update menuItem  - the owner of the restaurant can update the menu item details
router.delete("/:menuItemId", protect, deleteMenuItem);

// get the raing number by the logged in user
router.get("/:menuItemId/myRating", protect, GetMyRating);

// get all menu items
router.get("/", protect, getAllMenuItems);

module.exports = router;
