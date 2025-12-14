const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { findUserByProperty, createNewUser } = require("./user");
const jwt = require("jsonwebtoken");
const {
  assignToken,
  generateVerificationToken,
  verifyVerificationToken,
} = require("../utils/jwtFunction");
const AppError = require("../utils/AppError");
const { sendVerificationEmail } = require("../utils/emailService");

// register service
const registerService = async ({ email, password }) => {
  const user = await findUserByProperty("email", email);

  if (user) throw new AppError("User already registered", 400);

  //   hash the password before saving it to the database
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const newUser = await createNewUser({
    email,
    password: hash,
  });

  const verificationToken = generateVerificationToken(newUser._id, email);

  try {
    await sendVerificationEmail(email, verificationToken);
  } catch (error) {
    console.error("Failed to send verification email:", error);
  }

  return newUser;
};

// login service
const loginService = async (email, password) => {
  const user = await findUserByProperty("email", email);
  console.log(user);

  // if the user is not in the database
  if (!user) {
    const err = new Error("No user found with that email");
    err.status = 404;
    throw err;
  }

  const isMatched = await bcrypt.compare(password, user.password);

  // if password not matched with the database
  if (!isMatched) {
    const err = new Error("Password not matched");
    err.status = 401;
    throw err;
  }

  user.password = undefined;
  // jwt code is here
  const token = assignToken(user._id, email);
  const userObj = user.toObject();
  userObj.jwtToken = token;
  // user.jwtToken = token;

  return userObj;
};

// Verify Email Service
const verifyEmailService = async (token) => {
  if (!token) {
    throw new AppError("Verification token is required", 400);
  }

  const decoded = verifyVerificationToken(token);

  if (!decoded) {
    throw new AppError("Invalid or expired verification token", 400);
  }

  // console.log(decoded);

  const user = await User.findById(decoded.id);
  // console.log(user);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Check if already verified
  if (user.verified) {
    throw new AppError("Email is already verified", 400);
  }

  //Mark user as verified
  user.verified = true;
  await user.save();

  return { message: "Email verified successfully. You can now log in." };
};

module.exports = { loginService, registerService, verifyEmailService };
