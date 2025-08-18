const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const restaurantFollowSchema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  followed_at: {
    type: Date,
    default: Date.now,
  },
});

restaurantFollowSchema.index(
  { user_id: 1, restaurant_id: 1 },
  { unique: true }
);

const RestaurantFollow = model("RestaurantFollow", restaurantFollowSchema);
module.exports = RestaurantFollow;
