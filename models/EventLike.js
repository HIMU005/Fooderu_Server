const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const eventLikeSchema = new Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

eventLikeSchema.index({ eventId: 1, userId: 1 }, { unique: true });
const EventLike = model("EventLike", eventLikeSchema);

module.exports = EventLike;
