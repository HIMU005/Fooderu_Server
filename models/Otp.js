const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ["email_verification", "password_reset", "account_recovery"],
      default: "email_verification",
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 300 }, // Auto delete after 5 minutes
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for efficient queries
otpSchema.index({ email: 1, purpose: 1, isUsed: 1 });
otpSchema.index({ userId: 1, expiresAt: 1 });

// Pre-save hook to clean old unused OTPs for same email
otpSchema.pre("save", async function (next) {
  try {
    // Delete any existing unused OTPs for this email with same purpose
    await this.constructor.deleteMany({
      email: this.email,
      purpose: this.purpose,
      isUsed: false,
      _id: { $ne: this._id },
    });
    next();
  } catch (error) {
    console.error(error.message);

    next(error);
  }
});

// Method to check if OTP is valid
otpSchema.methods.isValid = function () {
  return !this.isUsed && this.expiresAt > new Date();
};

// Method to mark OTP as used
otpSchema.methods.markAsUsed = function () {
  this.isUsed = true;
  return this.save();
};

// Method to increment attempts
otpSchema.methods.incrementAttempts = function () {
  this.attempts += 1;
  return this.save();
};

// Static method to find valid OTP
otpSchema.statics.findValidOTP = function (
  email,
  otp,
  purpose = "email_verification",
) {
  return this.findOne({
    email: email.toLowerCase(),
    otp,
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });
};

// Static method to cleanup old OTPs
otpSchema.statics.cleanup = function () {
  return this.deleteMany({
    $or: [{ expiresAt: { $lt: new Date() } }, { isUsed: true }],
  });
};

const OTP = mongoose.model("OTP", otpSchema);
module.exports = OTP;
