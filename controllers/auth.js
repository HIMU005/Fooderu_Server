const { registerService, loginService } = require("../services/auth");
const { findUserByProperty } = require("../services/user");
const bcrypt = require("bcryptjs");

// controller for register
const registerController = async (req, res, next) => {
  const { email, password } = req.body;

  //   validation
  if (!email || !password) {
    throw error("Email and Password are required", 400);
  }

  try {
    const user = await registerService({
      email,
      password,
    });
    user.password = undefined;

    return res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    next(error);
  }
};

// controller for user
const logInController = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await loginService(email, password);
    return res.send({ status: 200, data: user });
  } catch (error) {
    return res.json({ status: 500, message: `server error ${error} ` });
  }
};

module.exports = { registerController, logInController };
