const User = require("../models/User");
const {
  registerServiceWeb,
  registerServiceOtp,
  verifyOTPService,
  resendOTPService,
  loginService,
  verifyEmailService,
  resendEmailVerificationService,
} = require("../services/auth");
const { findUserByProperty } = require("../services/user");
const bcrypt = require("bcryptjs");
const { assignToken } = require("../utils/jwtFunction");
const AppError = require("../utils/AppError");
const { Clerk } = require("@clerk/clerk-sdk-node");

// Register controller: For OTP
const registerControllerOTP = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({
      status: 400,
      message: "Email and Password are required",
    });
  }

  try {
    const result = await registerServiceOtp({ email, password });

    return res.status(201).json({
      status: 201,
      success: true,
      message: result.message,
      data: {
        email: result.email,
        userId: result.userId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify OTP Controller
const verifyOTPController = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new AppError("Email and OTP are required", 400);
    }

    const result = await verifyOTPService(email, otp);

    return res.status(200).json({
      status: "success",
      message: result.message,
      data: result.user,
    });
  } catch (error) {
    next(error);
  }
};

// Resend OTP Controller
const resendOTPController = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError("Email is required", 400);
    }

    const result = await resendOTPService(email);

    return res.status(200).json({
      status: 200,
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// controller for register
const registerControllerWeb = async (req, res, next) => {
  const { email, password } = req.body;

  //   validation
  if (!email || !password) {
    throw new AppError("Email and Password are required", 400);
  }

  try {
    const user = await registerServiceWeb({
      email,
      password,
    });
    user.password = undefined;

    return res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    next(error);
  }
};

const verifyEmailController = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res
        .status(400)
        .json({ message: "Verification token is required" });
    }

    const result = await verifyEmailService(token);

    return res.status(200).json({
      success: true,
      message: result.message,
      redirectUrl: `${process.env.FRONTEND_URL_LOCAL}/verification-success`,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Email verification failed",
      redirectUrl: `${process.env.FRONTEND_URL}/verification-failed`,
    });
  }
};

const ressendVerificationEmailController = async (req, res, next) => {
  try {
    const { email } = req.query;

    // Use the service
    const result = await resendEmailVerificationService(email);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
    // return next()
  }
};

// controller for user login
const logInController = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and Password are required", 400);
  }

  try {
    const user = await loginService(email, password);

    return res.status(200).json({ status: "success", data: user });
  } catch (error) {
    // Handle unverified email case
    if (error.statusCode === 403 && error.message.includes("OTP")) {
      return res.json({
        status: 403,
        success: false,
        message: error.message,
        requiresVerification: true,
        email: email,
      });
    }

    next(error);
  }
};

// controller for social login
const logInWithSocialController = async (req, res, next) => {
  const {
    oauth_id,
    email,
    oauth_provider,
    profile_picture,
    firstName,
    lastName,
  } = req.body;

  try {
    let user = await findUserByProperty("email", email);

    if (!user) {
      user = await User.create({
        oauth_id,
        email,
        oauth_provider,
        profile_picture,
        name: `${firstName} ${lastName}`,
      });
    }

    const token = assignToken(user._id, email);
    const userObj = user.toObject();
    userObj.jwtToken = token;

    return res.json({
      status: 200,
      message: "social login successfull",
      user: userObj,
    });
  } catch (error) {
    return res.json({ status: 500, message: `server error ${error} ` });
  }
};

// for clerk login
const clerkClient = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });
const logInWithClerkcontroller = async (req, res, next) => {
  try {
    const {
      oauth_id,
      clerk_id,
      email,
      oauth_provider,
      profile_picture,
      firstName,
      lastName,
    } = req.body;

    if (!email || !oauth_id || !oauth_provider)
      return res.json({
        status: 400,
        message: "required field is not provided",
      });
    const exitsingUser = await findUserByProperty("email", email);

    // if user already exists in the database
    if (exitsingUser && exitsingUser.oauth_provider === null) {
      // if user is registered with clerk delete from the clerk store
      await clerkClient.users.deleteUser(clerk_id);
      return res.json({
        status: 409,
        message: "Email already registered. please try with email and password",
      });
    }

    if (exitsingUser && exitsingUser.oauth_provider !== oauth_provider) {
      return res.json({
        status: 409,
        message: "Email already registered. please try with email and password",
      });
    }

    if (exitsingUser && exitsingUser.oauth_provider === oauth_provider) {
      const token = assignToken(exitsingUser._id, email);
      const user = { ...exitsingUser, jwtToken: token };
      return res.json({
        status: 200,
        user,
        message: "login successfull",
      });
    }

    if (!exitsingUser) {
      const user = await User.create({
        oauth_id,
        email,
        oauth_provider,
        profile_picture,
        name: `${firstName} ${lastName}`,
      });
      // assign jwt token
      const token = assignToken(user._id, email);
      const userObj = user.toObject();
      userObj.jwtToken = token;

      return res.json({
        status: 200,
        message: "login successfull",
        user: userObj,
      });
    }
  } catch (error) {
    return res.json({ status: 500, message: `server error ${error} ` });
  }
};

const loginWithFirebaseController = async (req, res, next) => {
  try {
    const payload = req.body;
    const exitsingUser = await findUserByProperty("email", payload?.email);

    if (exitsingUser) {
      const token = assignToken(exitsingUser._id, payload.email);
      const user = { ...exitsingUser.toObject(), jwtToken: token };
      return res.json({
        status: 200,
        message: "already logged in",
        data: user,
      });
    }

    if (!exitsingUser) {
      const newUser = await User.create({
        ...payload,
        verified: true,
      });

      const token = assignToken(newUser._id, payload.email);
      const userObj = newUser.toObject();
      userObj.jwtToken = token;
      return res.status(200).json({
        status: "success",
        message: "new user created",
        data: userObj,
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerControllerWeb,
  logInController,
  logInWithSocialController,
  logInWithClerkcontroller,
  loginWithFirebaseController,
  verifyEmailController,
  ressendVerificationEmailController,
  registerControllerOTP,
  verifyOTPController,
  resendOTPController,
};
