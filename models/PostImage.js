const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const PostImageSchema = new Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["image", "video"],
      default: "image",
      index: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

PostImageSchema.index({ postId: 1, isPrimary: 1 });
PostImageSchema.index({ postId: 1, order: 1 });

module.exports = model("PostImage", PostImageSchema);
