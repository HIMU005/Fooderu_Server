const express = require("express");
const {
  PostARating,
  GetASingleMenuItem,
  GetMyRating,
  getAllMenuItems,
} = require("../controllers/menuItemController");
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();

//post route for rating a menu item
router.post("/:menuItemId/rate", PostARating);

// get a single munu item by its id
router.get("/:menuItemId", GetASingleMenuItem);

// get the raing number by the logged in user
router.get("/:menuItemId/myrating", GetMyRating);

// get all menu items
router.get("/", getAllMenuItems);

module.exports = router;
