const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const Restaurant = require("./Restaurants");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  clerk_id: {
    type: String,
  },
  phone: {
    type: String,
  },
  password: {
    type: String,
    select: false, // hides it from query results
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
  location: {
    type: String,
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
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

const User = model("User", userSchema);
module.exports = User;
