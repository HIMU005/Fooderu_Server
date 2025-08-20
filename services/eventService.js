const Event = require("../models/Event");
const Restaurant = require("../models/Restaurant");

// Create a new event
const createEvent = async (restaurantId, eventData) => {
  // Check if restaurant exists
  const restaurantExists = await Restaurant.findOne({ _id: restaurantId });
  console.log("exist : ", restaurantExists);
  if (!restaurantExists) {
    throw new Error("Restaurant not found");
  }

  // Create and save the event
  const event = new Event({
    restaurant_id: restaurantId,
    ...eventData,
  });

  return await event.save();
};

// Get events for a restaurant
const getEvents = async (restaurantId, onlyLive = false) => {
  const query = { restaurant_id: restaurantId };

  // Filter for live events if requested
  if (onlyLive) {
    query.is_live = true;
    query.expires_at = { $gt: new Date() }; // Not expired
  }

  return await Event.find(query).sort({ created_at: -1 }); // Newest first
};

// Toggle an event's live status
const toggleEventStatus = async (eventId) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new Error("Event not found");
  }

  event.is_live = !event.is_live;
  return await event.save();
};

module.exports = {
  createEvent,
  getEvents,
  toggleEventStatus,
};
