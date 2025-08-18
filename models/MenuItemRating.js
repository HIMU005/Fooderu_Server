const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const menuItemRatingSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },

    menuItem: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: [true, "Menu item referenec is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
  },
  {
    timestamps: true,
  }
);

menuItemRatingSchema.index({ user: 1, menuItem: 1 }, { unique: true });

const MenuItemRating = model("MenuItemRating", menuItemRatingSchema);

module.exports = MenuItemRating;
