const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const userController = require("../controllers/userController");

// Protected routes
router.get("/me", protect, userController.getUserProfile);

router.put("/me",
  // protect,
   userController.updateUserProfile);

router.patch(
  "/changePassword",
  protect,
  userController.changePasswordController,
);

module.exports = router;
