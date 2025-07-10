const { Schema, model } = require("mongoose");

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
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
