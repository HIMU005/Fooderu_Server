const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const Restaurant = require("./Restaurant");

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      // required: true,
      select: false, // hides it from query results
    },
    verified: {
      type: Boolean,
      default: false,
    },
    oauth_provider: {
      type: String, // e.g., 'google', 'facebook'
    },
    oauth_id: {
      type: String, // ID from provider (e.g. Google user ID)
    },
    user_type: {
      type: String,
      enum: ["admin", "user"], // update as needed
      default: "user",
    },
    name: {
      type: String,
    },
    profile_picture: {
      type: String,
    },
    coverPhoto: {
      type: String,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[0-9]{7,15}$/, "Invalid phone number"],
      sparse: true,
      unique: true,
    },
    date_of_birth: {
      type: Date,
      validate: {
        validator: (v) => !v || v < new Date(),
      },
    },
    location: {
      address: {
        type: String,
      },
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        // required: true,
      },
      coordinates: {
        type: [Number],
        // maxlength: 2,
        validate: {
          validator: (v) => v.length <= 2,
          message: "Coordinates must be [longitude, latitude]",
        },
      },
    },
    interests: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "banned"],
      default: "active",
    },
    restaurant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    hasRestaurant: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

//  this is for geospatial queries and filtering based on user location
userSchema.index({ location: "2dsphere" });

const User = model("User", userSchema);
module.exports = User;
