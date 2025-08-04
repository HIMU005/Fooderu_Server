const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define what an event looks like in our database
const eventSchema = new Schema({
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
    default: false, // Events start as not live
  },
  image_url: String, // Optional image link
  expires_at: {
    type: Date,
    required: true, // Must have an expiration date
  },
  created_at: {
    type: Date,
    default: Date.now, // Automatically set when created
  },
});

// Create the Event model from our schema
const Event = mongoose.model("Event", eventSchema);
module.exports = Event;
