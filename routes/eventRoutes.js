const express = require("express");
const router = express.Router({ mergeParams: true });
const { protect } = require("../middlewares/authMiddleware");
const {
  create,
  getEventsOfSingleRestaurant,
  toggleStatus,
  getAllEventsFromAllRestaurants,
  likeAndUnlikeEvent,
} = require("../controllers/eventController");

// Protect routes that modify data
router.post("/:restaurantId", protect, create);
router.patch("/:restaurantId/:eventId/toggle", protect, toggleStatus);
// Public route for getting events of a single restaurant
router.get("/:restaurantId", protect, getEventsOfSingleRestaurant);

// like an event
router.post("/:id/like", protect, likeAndUnlikeEvent);

//api for getting all the events of all restaurant
router.get("/", protect, getAllEventsFromAllRestaurants);

module.exports = router;
