const mongoose = require("mongoose");
const { Schema } = mongoose;

const cautionSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

cautionSchema.index({
  name: "text",
});

const Caution = mongoose.model("Caution", cautionSchema);
module.exports = Caution;
