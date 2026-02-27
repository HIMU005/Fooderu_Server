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
    details: {
      description: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// virtual populate for post media
postSchema.virtual("media", {
  ref: "PostImage",
  localField: "_id",
  foreignField: "postId",
});

// indexes for text search and filtering
postSchema.index({ "details.description": "text" });
postSchema.index({ restaurant_id: 1 });

const Post = model("Post", postSchema);
module.exports = Post;
