const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define what an event looks like in our database
const eventSchema = new Schema(
  {
    restaurant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant", // Links to the Restaurant model
      required: true, // Must have a restaurant
    },
    event_title: {
      type: String,
      required: true, // Every event needs a title
      maxlength: 100, // Title can't be too long
    },
    description: String, // Optional description
    is_live: {
      type: Boolean,
      default: true, // Events start as  live bydefault
    },
    image_url: String, // Optional image link

    averageRating: {
      type: Number,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    totalLikes: {
      type: Number,
      default: 0,
    },
    start_at: {
      type: Date,
      required: true,
    },
    expires_at: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// deletes from database after expires
eventSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
eventSchema.index({ is_live: 1, start_at: -1 });
eventSchema.index({ restaurant_id: 1, start_at: -1 });

// Create the Event model from our schema
const Event = mongoose.model("Event", eventSchema);
module.exports = Event;
