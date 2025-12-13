const User = require("../models/User");
const { registerService, loginService } = require("../services/auth");
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
    throw new AppError("Email and Password are required", 400);
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

    throw new AppError("Error while registering the user", 500);
  }
};

// controller for user login
const logInController = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await loginService(email, password);
    return res.send({ status: 200, data: user });
  } catch (error) {
    return res.json({ status: 500, message: `server error ${error} ` });
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
};
