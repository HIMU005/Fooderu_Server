const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  saveItem,
  unsaveItem,
  getSavedItems,
  checkSaved,
  clearAllSaved,
} = require("../controllers/savedItemControllers");

router.post("/", protect, saveItem);
router.delete("/", protect, unsaveItem);
router.get("/", protect, getSavedItems);
router.get("/check", protect, checkSaved);
router.delete("/clear", protect, clearAllSaved);

module.exports = router;
