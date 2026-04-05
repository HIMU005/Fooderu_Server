const mongoose = require("mongoose");
const { trim } = require("validator");
const User = require("./User");
const { Schema, model } = mongoose;
const restaurantSchema = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
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
    //updated address field
    address: {
      country: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      manualAddress: { type: String, trim: true }, //  text for manual address required changed to not by jobaer6767
      mapAddress: { type: String, required: true, trim: true }, //  text for map address
    },
    location: {
      type: {
        type: String,
        enum: ["Point"], // GeoJSON type
        default: "Point", // auto-set
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "banned"],
      default: "active",
    },
    restaurant_type: {
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
    displayPicture: {
      type: String,
      required: true,
    },
    coverPicture: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

restaurantSchema.virtual("followers", {
  ref: "RestaurantFollow",
  localField: "_id",
  foreignField: "restaurant_id",
});

restaurantSchema.virtual("followersCount", {
  ref: "RestaurantFollow",
  localField: "_id",
  foreignField: "restaurant_id",
  count: true,
});

// this is for filtering the restaurant by location and distance
restaurantSchema.index({ location: "2dsphere" });

const Restaurant = model("Restaurant", restaurantSchema);
module.exports = Restaurant;
