const mongoose = require("mongoose");
const { Schema } = mongoose;

const postSchema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  description: {
    type: String,
  },
  photo: {
    type: String,
  },
  isEvent: {
    type: Boolean,
    default: false,
  },
});
