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
    throw new AppError(
      "Failed to send verification email. Please try again later.",
      500
    );
  }

  return newUser;
};

// login service
const loginService = async (email, password) => {
  const user = await findUserByProperty("email", email);

  // if the user is not in the database
  if (!user) {
    // throw new AppError("User not found", 404);
    return next(new AppError("User not found", 404));
  }

  const isMatched = await bcrypt.compare(password, user.password);

  // if password not matched with the database
  if (!isMatched) {
    // throw new AppError("Password not matched", 401);
    return next(new AppError("Password not matched", 401));
  }

  // Check if email is verified
  if (!user.verified) {
    // throw new AppError(
    //   "Email not verified. Please verify your email before logging in.",
    //   403
    // );
    return next(
      new AppError(
        "Email not verified. Please verify your email before logging in.",
        403
      )
    );
  }

  user.password = undefined;

  // jwt code is here
  const token = assignToken(user._id, email, user.user_type);

  // Convert user to object and add token
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

const resendEmailVerificationService = async (email) => {
  if (!email) {
    throw new AppError("Email is required", 400);
  }

  // console.log("email from service", email);

  // Find the user by email
  const user = await findUserByProperty("email", email);
  // console.log("user from service", user);

  // If user doesn't exist, return a generic response for security
  if (!user) {
    // Don't reveal that the user doesn't exist
    return {
      message:
        "If an account exists with this email, a verification link has been sent.",
    };
  }

  // Check if user is already verified
  if (user.verified) {
    throw new AppError("Email is already verified", 400);
  }

  // Generate a new verification token
  const verificationToken = generateVerificationToken(user._id, email);

  try {
    await sendVerificationEmail(user.email, verificationToken, user.name);
  } catch (error) {
    throw new AppError(
      "Failed to send verification email. Please try again later.",
      500
    );
  }

  return {
    message: "Verification email sent successfully. Please check your inbox.",
  };
};

module.exports = {
  loginService,
  registerService,
  verifyEmailService,
  resendEmailVerificationService,
};
