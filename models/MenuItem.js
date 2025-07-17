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
      index: true, // Added for faster name searches
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      set: (v) => parseFloat(v.toFixed(2)),
      validate: {
        validator: Number.isFinite,
        message: "Price must be a valid number",
      },
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
    image_url: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(v),
        message: "Invalid image URL format",
      },
    },
    is_boosted: {
      type: Boolean,
      default: false,
    },
    boosted_until: {
      type: Date,
      validate: {
        validator: function (v) {
          if (!this.is_boosted || !v) return true;
          return v > new Date();
        },
        message: "Boost date must be in the future when active",
      },
    },
    created_at: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-update timestamp
menuItemSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

// Compound indexes for performance
menuItemSchema.index({
  restaurant_id: 1,
  is_boosted: -1,
});
menuItemSchema.index({
  name: "text",
  description: "text",
});

const MenuItem = mongoose.model("MenuItem", menuItemSchema);
module.exports = MenuItem;
