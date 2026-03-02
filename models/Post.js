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
      name: {
        type: String,
        trim: true,
        maxlength: [100, "Name cannot exceed 100 characters"],
        index: true,
      },
      price: {
        type: Number,
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
    },

    type: {
      type: String,
      enum: ["normal", "menuItem"],
      default: "normal",
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
