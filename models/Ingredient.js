const mongoose = require("mongoose");
const { Schema } = mongoose;

const ingredientSchema = new Schema(
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

ingredientSchema.index({
  name: "text",
});

const Ingredient = mongoose.model("Ingredient", ingredientSchema);
module.exports = Ingredient;
