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
      resources: [
        {
          type: {
            type: String,
            enum: ["image", "video"],
            default: "image",
          },
          url: {
            type: String,
            required: true,
            trim: true,
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  },
);

// const postSchema = new Schema(
//   {
//     restaurant_id: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Restaurant",
//       required: true,
//       index: true,
//     },
//     description: {
//       type: String,
//       trim: true,
//     },
//     image_url: {
//       type: String,
//       trim: true,
//     },
//     isEvent: {
//       type: Boolean,
//       default: false,
//     },
//     postType: {
//       type: String,
//       enum: ["normal", "menuItem", "event"],
//       default: "normal",
//     },
//     details: {
//       type: mongoose.Schema.Types.Mixed,
//       default: {},
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

postSchema.index({ "details.description": "text" });
postSchema.index({ "details.resources.type": 1 });
postSchema.index({ restaurant_id: 1 });

const Post = model("Post", postSchema);
module.exports = Post;
