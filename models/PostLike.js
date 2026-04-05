const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const postLikeSchema = new Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

postLikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

const PostLike = model("PostLike", postLikeSchema);
module.exports = PostLike;
