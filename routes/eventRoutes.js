const express = require("express");
const router = express.Router({ mergeParams: true });
const { protect } = require("../middlewares/authMiddleware");
const {
  create,
  getAll,
  toggleStatus,
} = require("../controllers/eventController");

// Protect routes that modify data
router.post("/", create);
router.patch("/:eventId/toggle", toggleStatus);

// Public route for getting events
router.get("/", getAll);

module.exports = router;
