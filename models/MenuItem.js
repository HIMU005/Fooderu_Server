const mongoose = require("mongoose");
const { Schema } = mongoose;

const menuItemSchema = new Schema(
  {
    // Required Fields
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
      index: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    restaurant_id: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Restaurant reference is required"],
      immutable: true, // Prevent changing restaurant after creation
    },

    // Optional Fields with Enhanced Validation
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    // Old Design: image_url as a simple string
    // Will be deprecated in favor of MenuItemImage model for better scalability and flexibility
    image_url: {
      type: String,
      trim: true,
    },
    is_boosted: {
      type: Boolean,
      default: false,
    },
    boosted_until: {
      type: Date,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      enum: ["menuItem"],
      default: "menuItem",
    },
    ingredients: [
      {
        type: String,
        trim: true,
      },
    ],
    cautions: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Compound indexes for performance
menuItemSchema.index({
  restaurant_id: 1,
  is_boosted: -1,
});
menuItemSchema.index({
  name: "text",
  description: "text",
});

menuItemSchema.virtual("images", {
  ref: "MenuItemImage",
  localField: "_id",
  foreignField: "menuItemId",
});

const MenuItem = mongoose.model("MenuItem", menuItemSchema);
module.exports = MenuItem;
