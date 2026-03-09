const { default: mongoose } = require("mongoose");
const Event = require("../models/Event");
const EventLike = require("../models/EventLike");
const Restaurant = require("../models/Restaurant");
const AppError = require("../utils/AppError");

function splitDateTime(dateObj) {
  if (!dateObj) return null;

  const date = new Date(dateObj);

  return {
    date: date.toISOString().slice(0, 10), // YYYY-MM-DD
    time: date.toTimeString().slice(0, 5), // HH:mm
  };
}

// Create a new event
const createEvent = async (restaurantId, eventData) => {
  // // Check if restaurant exists
  // const restaurantExists = await Restaurant.findOne({ _id: restaurantId });
  // // console.log("exist : ", restaurantExists);
  // if (!restaurantExists) {
  //   // throw new Error("Restaurant not found");
  //   return next(new AppError("Restaurant not found", 404));
  // }

  // Create and save the event
  const event = new Event({
    restaurant_id: restaurantId,
    ...eventData,
  });

  return await event.save();
};

// Get events for a restaurant
const getEventsOfRestaurant = async (restaurantId, onlyLive = false) => {
  const query = { restaurant_id: restaurantId };

  const restaurantExists = await Restaurant.findOne({ _id: restaurantId });
  if (!restaurantExists) {
    throw new AppError("Restaurant not found", 404);
  }

  // Filter for live events if requested
  if (onlyLive) {
    query.is_live = true;
    query.expires_at = { $gt: new Date() }; // Not expired
  }

  return await Event.find(query).sort({ created_at: -1 }); // Newest first
};

// Toggle an event's live status
const toggleEventStatus = async (eventId, restaurantId) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError("Event not found", 404);
  }
  if (event?.restaurant_id.toString() !== restaurantId) {
    throw new AppError("This event and the restaurant are not associated", 403);
  }
  if (!event) {
    throw new AppError("Event not found", 404);
  }

  event.is_live = !event.is_live;
  return await event.save();
};

const likeAndUnlikeEventService = async (eventId, userId) => {
  // not valid event id
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new AppError("Invalid event ID", 400);
  }

  const event = await Event.findById(eventId);

  if (!event) {
    throw new AppError("No event found", 404);
  }

  const existingLike = await EventLike.findOne({ eventId, userId });

  if (existingLike) {
    await EventLike.findByIdAndDelete(existingLike._id);
    await Event.findByIdAndUpdate(eventId, {
      $inc: { totalLikes: -1 },
    });

    return {
      status: "success",
      message: "Event unlike successfull",
      liked: false,
    };
  } else {
    await EventLike.create({ eventId, userId });

    await Event.findByIdAndUpdate(eventId, {
      $inc: { totalLikes: 1 },
    });
    return {
      status: "success",
      message: "event like successful",
      liked: true,
    };
  }
};

module.exports = {
  createEvent,
  getEventsOfRestaurant,
  toggleEventStatus,
  likeAndUnlikeEventService,
};
