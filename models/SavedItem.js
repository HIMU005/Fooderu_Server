const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const savedItemSchema = new Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to ensure a user can't save the same item twice
// Also makes queries for "is this saved?" super fast
savedItemSchema.index({ userId: 1, menuItemId: 1 }, { unique: true });

// Index for fetching user's saved items in chronological order
// Used when you go to profile > saved items
savedItemSchema.index({ userId: 1, createdAt: -1 });

// Optional: Index if you need analytics like "most saved items"
savedItemSchema.index({ menuItemId: 1 });

// Optional: If you need to cleanup old saved items or for analytics
savedItemSchema.index({ createdAt: -1 });

const SavedItem = model("SavedItem", savedItemSchema);
module.exports = SavedItem;
