const express = require("express");
const router = express.Router({ mergeParams: true });
const { protect } = require("../middlewares/authMiddleware");
const {
  create,
  getEventsOfSingleRestaurant,
  toggleStatus,
  getAllEventsFromAllRestaurants,
} = require("../controllers/eventController");

// Protect routes that modify data
router.post("/:restaurantId", create);
router.patch("/:restaurantId/:eventId/toggle", toggleStatus);
// Public route for getting events of a single restaurant
router.get("/:restaurantId", getEventsOfSingleRestaurant);
//api for getting all the events of all restaurant
router.get("/", getAllEventsFromAllRestaurants);

module.exports = router;
