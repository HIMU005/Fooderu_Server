const express = require("express");
const {
  PostARating,
  GetASingleMenuItem,
  GetMyRating,
  getAllMenuItems,
  getMenuItemsByFollowedRestaurants,
  updateMenuItem,
  deleteMenuItem,
  uploadMenuImages,
} = require("../controllers/menuItemController");
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get(
  "/getMenuItemsByFollowedRestaurants",
  protect,
  getMenuItemsByFollowedRestaurants,
);

//post route for rating a menu item
router.post("/:menuItemId/rate", protect, PostARating);

// POST route for uploading menu item images - this will be used by the restaurant owner to upload images for their menu items
// This route will handle multiple image uploads and associate them with the correct menu item
router.post(
  "/:menuItemId/uploadImages",
  protect,
  upload.array("images", 10),
  uploadMenuImages,
);

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
