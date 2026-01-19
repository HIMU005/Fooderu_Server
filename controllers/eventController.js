const e = require("express");
const Event = require("../models/Event");
const Restaurant = require("../models/Restaurant");
const {
  createEvent,
  toggleEventStatus,
  getEventsOfRestaurant,
} = require("../services/eventService");
const AppError = require("../utils/AppError");
const { default: mongoose } = require("mongoose");

// Handle creating a new event
const create = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      throw new AppError("Invalid restaurant ID", 400);
    }
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new AppError("Restaurant not found", 404);
    }
    const { event_title, description, image_url, expires_at } = req.body;
    if (restaurantId !== req.user.restaurant_id.toString()) {
      throw new AppError(
        "You are not authorized to create event for this restaurant",
        403,
      );
    }

    // Basic validation
    if (!event_title || !expires_at) {
      throw new AppError("Title and expiration date are required", 400);
    }

    const newEvent = await createEvent(restaurantId, {
      event_title,
      description,
      image_url,
      expires_at: new Date(expires_at),
    });

    res.status(201).json({
      status: "success",
      statusCode: 201,
      data: newEvent,
      message: "Event created successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Handle getting events
const getEventsOfSingleRestaurant = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      throw new AppError("Invalid restaurant ID", 400);
    }
    const { live } = req.query;

    const events = await getEventsOfRestaurant(restaurantId, live === "true");
    res.status(200).json({
      status: "success",
      statusCode: 200,
      data: events,
    });
  } catch (error) {
    // res.status(400).json({ error: error.message });
    next(error);
  }
};

//get all events from all restaurant

const getAllEventsFromAllRestaurants = async (req, res) => {
  try {
    const { live } = req.query;

    let query = {};
    if (live === "true") {
      query.is_live = true;
      query.expires_at = { $gt: new Date() };
    }

    const events = await Event.find(query)
      .select("-__v") // Exclude version field
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    // console.error("Error getting all events:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching events",
    });
  }
};

// Handle toggling event status
const toggleStatus = async (req, res, next) => {
  try {
    const { eventId, restaurantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new AppError("Invalid event ID", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      throw new AppError("Invalid restaurant ID", 400);
    }

    if (restaurantId !== req.user.restaurant_id.toString()) {
      throw new AppError(
        "You are not authorized to toggle event for this restaurant",
        403,
      );
    }

    const updatedEvent = await toggleEventStatus(eventId, restaurantId);
    return res.status(200).json({
      status: "success",
      statusCode: 200,
      data: updatedEvent,
    });
  } catch (error) {
    // res.status(400).json({ error: error.message });
    next(error);
  }
};

module.exports = {
  create,
  getEventsOfSingleRestaurant,
  getAllEventsFromAllRestaurants,
  toggleStatus,
};
