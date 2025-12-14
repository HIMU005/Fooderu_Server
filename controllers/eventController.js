const Event = require("../models/Event");
const {
  createEvent,
  toggleEventStatus,
  getEventsOfRestaurant,
} = require("../services/eventService");

// Handle creating a new event
const create = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    // console.log(restaurantId);
    const { event_title, description, image_url, expires_at } = req.body;
    // console.log(req.body);

    // Basic validation
    if (!event_title || !expires_at) {
      return res
        .status(400)
        .json({ error: "Title and expiration date are required" });
    }

    const newEvent = await createEvent(restaurantId, {
      event_title,
      description,
      image_url,
      expires_at: new Date(expires_at),
    });

    res.status(201).json(newEvent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Handle getting events
const getEventsOfSingleRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { live } = req.query;

    const events = await getEventsOfRestaurant(restaurantId, live === "true");
    res.json(events);
  } catch (error) {
    res.status(400).json({ error: error.message });
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
const toggleStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updatedEvent = await toggleEventStatus(eventId);
    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  create,
  getEventsOfSingleRestaurant,
  getAllEventsFromAllRestaurants,
  toggleStatus,
};
