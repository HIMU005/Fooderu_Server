const mongoose = require("mongoose");
const { trim } = require("validator");
const { Schema, model } = mongoose;
const restaurantSchema = new mongoose.Schema(
  {
    owner_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    registration_no: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "banned"],
      default: "active",
    },
    Restaurant_type: {
      type: String,
      enum: ["fast_food", "fine_dining", "cafe", "food_truck", "other"],
      default: "other",
    },

    boosted_until: {
      type: Date,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Mongoose will add createdAt and updatedAt automatically
  }
);

const Restaurant = model("Restaurant", restaurantSchema);
module.exports = Restaurant;
