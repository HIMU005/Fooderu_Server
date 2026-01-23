const crypto = require("crypto");

// Generates a 6-digit numeric OTP
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Generates alphanumeric OTP of given length
const generateAlphanumericOtp = (length = 6) => {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += chars[Math.floor(Math.random() * chars.length)];
  }

  return otp;
};

module.exports = {
  generateOtp,
  generateAlphanumericOtp,
};
