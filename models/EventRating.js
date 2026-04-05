const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const eventRatingSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },

    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event referenec is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
  },
  { timestamps: true },
);

eventRatingSchema.index({ userId: 1, eventId: 1 }, { unique: true });

const EventRating = model("EventRating", eventRatingSchema);

module.exports = EventRating;
