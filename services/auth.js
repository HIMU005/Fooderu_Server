const bcrypt = require("bcryptjs");
const { findUserByProperty, createNewUser } = require("./user");
const jwt = require("jsonwebtoken");
const { assignToken } = require("../utils/jwtFunction");
const AppError = require("../utils/AppError");

// register service
const registerService = async ({ email, password }) => {
  const user = await findUserByProperty("email", email);

  if (user) throw new AppError("User already registered", 400);

  //   hash the password before saving it to the database
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  const verification_token = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  return createNewUser({
    email,
    password: hash,
    verification_token,
    verification_token_expires_in: Date.now() + 3600000, // 1 hour from now
  });
};

// login service
const loginService = async (email, password) => {
  const user = await findUserByProperty("email", email).select("+password");

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

module.exports = { loginService, registerService };
