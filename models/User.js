const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: [2, "Name must be at least 2 Characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      validate: {
        validator: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        message: "Please provide a valid email",
      },
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: (phone) => /^(?:\+?88)?01[3-9]\d{8}$/.test(phone),
        message: "Please provide a valid Bangladeshi phone number",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const User = model("User", userSchema);
module.exports = User;
