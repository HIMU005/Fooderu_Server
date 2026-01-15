const User = require("../models/User");
const {
  registerService,
  loginService,
  verifyEmailService,
  resendEmailVerificationService,
} = require("../services/auth");
const { findUserByProperty } = require("../services/user");
const bcrypt = require("bcryptjs");
const { assignToken } = require("../utils/jwtFunction");
const AppError = require("../utils/AppError");
const { Clerk } = require("@clerk/clerk-sdk-node");

// controller for register
const registerController = async (req, res, next) => {
  const { email, password } = req.body;

  //   validation
  if (!email || !password) {
    // throw new AppError("Email and Password are required", 400);
    // return next(new AppError("Email and Password are required", 400));
    return res.json({
      status: 400,
      message: "Email and Password are required",
    });
  }

  // if user already exists
  const existingUser = await findUserByProperty("email", email);
  if (existingUser) {
    // throw new AppError("User already exists with this email", 409);
    // return next(new AppError("User already exists with this email", 409));
    return res.json({
      status: 409,
      message: "User already exists with this email",
    });
  }

  try {
    const user = await registerService({
      email,
      password,
    });
    user.password = undefined;

    return res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    console.error(error);

    // throw new AppError("Error while registering the user", 500);
    return next(new AppError("Error while registering the user", 500));
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
    console.error(error);

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
    // console.log(email);

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
    // throw new AppError("Email and Password are required", 400);
    // return next(new AppError("Email and Password are required", 400));
    return res.json({
      status: 400,
      message: "Email and Password are required",
    });
  }

  try {
    const user = await loginService(email, password);
    // console.log(user);

    return res.send({ status: 200, data: user });
  } catch (error) {
    console.error(error);

    return res.json({ status: error.status, message: `${error.message} ` });
    // return next(new AppError(error.message, error.statusCode || 500));
    // return next(error);
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
  const payload = req.body;
  // console.log(155, payload);
  const exitsingUser = await findUserByProperty("email", payload?.email);

  // console.log(158, exitsingUser);
  if (exitsingUser) {
    // console.log("i am here ");
    const token = assignToken(exitsingUser._id, payload.email);
    const user = { ...exitsingUser.toObject(), jwtToken: token };
    return res.json({ status: 200, message: "already logged in", data: user });
  }

  if (!exitsingUser) {
    // console.log("new user ");
    const newUser = await User.create({
      ...payload,
      // email: payload.email,
      // name: payload.name,
      // profile_picture: payload.picture,
      // oauth_provider: payload?.oauth_provider,
    });

    const token = assignToken(newUser._id, payload.email);
    const userObj = newUser.toObject();
    userObj.jwtToken = token;
    return res.json({
      status: 200,
      memssage: "new user created",
      data: userObj,
    });
  }

  return res.json({ status: 200, message: "connected", data: payload });
};

module.exports = {
  registerController,
  logInController,
  logInWithSocialController,
  logInWithClerkcontroller,
  loginWithFirebaseController,
  verifyEmailController,
  ressendVerificationEmailController,
};
