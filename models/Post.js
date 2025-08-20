const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const postSchema = new Schema(
  {
    restaurant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
      trim: true,
    },
    isEvent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Post = model("Post", postSchema);
module.exports = Post;
