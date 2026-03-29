const e = require("express");
const Event = require("../models/Event");
const Restaurant = require("../models/Restaurant");
const {
  createEvent,
  toggleEventStatus,
  getEventsOfRestaurant,
  likeAndUnlikeEventService,
} = require("../services/eventService");
const AppError = require("../utils/AppError");
const { default: mongoose } = require("mongoose");
const EventRating = require("../models/EventRating");
const EventLike = require("../models/EventLike");

function combineDateTime(dateStr, timeStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

function splitDateTime(dateObj) {
  if (!dateObj) return null;

  const date = new Date(dateObj);

  return {
    date: date.toISOString().slice(0, 10), // YYYY-MM-DD
    time: date.toTimeString().slice(0, 5), // HH:mm
  };
}

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

    // Authorization
    if (restaurantId !== req.user.restaurant_id.toString()) {
      throw new AppError(
        "You are not authorized to create event for this restaurant",
        403,
      );
    }

    const {
      event_title,
      description,
      image_url,
      start_time,
      start_date,
      expire_time,
      expire_date,
    } = req.body;

    // Basic validation
    if (!event_title) {
      throw new AppError("Title is required", 400);
    }

    if (!start_time || !start_date || !expire_date || !expire_time) {
      throw new AppError("Start and expire Date and Time are required", 400);
    }

    const start_at = combineDateTime(start_date, start_time);

    const expires_at = combineDateTime(expire_date, expire_time);

    // VERY IMPORTANT validation
    if (expires_at <= start_at) {
      throw new AppError("Expire time must be after start time", 400);
    }

    const newEvent = await createEvent(restaurantId, {
      event_title,
      description,
      image_url,
      start_at,
      expires_at,
    });

    res.status(201).json({
      status: "success",
      statusCode: 201,
      // data: newEvent,
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

    const onlyLive = true;

    const events = await getEventsOfRestaurant(restaurantId, onlyLive);

    // transform response
    const formattedEvents = events.map((event) => {
      const start = splitDateTime(event.start_at);
      const expire = splitDateTime(event.expires_at);

      const { start_at, expires_at, ...rest } = event.toObject();

      return {
        ...rest,
        start_date: start.date,
        start_time: start.time,
        expire_date: expire.date,
        expire_time: expire.time,
      };
    });

    const { start_at, expires_at, ...rest } = formattedEvents;

    res.status(200).json({
      status: "success",
      statusCode: 200,
      data: rest,
    });
  } catch (error) {
    next(error);
  }
};

//get all events from all restaurant
const getAllEventsFromAllRestaurants = async (req, res, next) => {
  try {
    const now = new Date();
    const userId = req?.user?._id;

    const query = {
      expires_at: { $gt: now }, // not expired
    };

    const events = await Event.find(query).sort({ created_at: -1 }).lean();

    //  Get liked events by this user
    let likedEventIds = [];
    if (userId && events.length) {
      const likes = await EventLike.find({
        userId,
        eventId: { $in: events.map((e) => e._id) },
      }).select("eventId");

      likedEventIds = likes.map((like) => like.eventId.toString());
    }

    //  Get rated events by this user
    let ratingsMap = {};
    if (userId && events.length) {
      const ratings = await EventRating.find({
        userId,
        eventId: { $in: events.map((e) => e._id) },
      }).select("eventId rating");

      ratings.forEach((r) => {
        ratingsMap[r.eventId.toString()] = r.rating;
      });
    }

    const formattedEvents = events.map((event) => {
      const eventIdStr = event._id.toString();
      const start = splitDateTime(
        event.start_at ? event.start_at : event.created_at, // backward compitability as some are saved as created_at
      );
      const expire = splitDateTime(event.expires_at);

      const { start_at, expires_at, ...rest } = event;
      const myRating = ratingsMap[eventIdStr];
      const isRated = myRating !== undefined;
      return {
        ...rest,
        isLiked: likedEventIds.includes(eventIdStr),
        isRated,
        ...(isRated && { myRating }),
        start_date: start.date,
        start_time: start.time,
        expire_date: expire.date,
        expire_time: expire.time,
      };
    });

    res.status(200).json({
      success: true,
      count: events.length,
      data: formattedEvents,
    });
  } catch (error) {
    next(error);
    console.error(error);
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

// like unlike controller
const likeAndUnlikeEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req?.user?._id;

    const result = await likeAndUnlikeEventService(id, userId);

    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const rateAnEvent = async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid Event ID format", 400);
    }
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }
    // create or update rating
    await EventRating.findOneAndUpdate(
      {
        userId: userId,
        eventId: id,
      },
      {
        rating,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    const eventObjectId = new mongoose.Types.ObjectId(id);

    // recalculate rating
    const agg = await EventRating.aggregate([
      {
        $match: { eventId: eventObjectId },
      },
      {
        $group: {
          _id: "$eventId",
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    // update event rating stats
    await Event.findByIdAndUpdate(id, {
      averageRating: agg[0]?.averageRating || 0,
      totalRatings: agg[0]?.totalRatings || 0,
    });

    return res.status(200).json({
      status: "success",
      message: "Thanks for your rating.",
      averageRating: agg[0]?.averageRating || 0,
      totalRatings: agg[0]?.totalRatings || 0,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getEventsOfSingleRestaurant,
  getAllEventsFromAllRestaurants,
  toggleStatus,
  likeAndUnlikeEvent,
  rateAnEvent,
  splitDateTime,
};
