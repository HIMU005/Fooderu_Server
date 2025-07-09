const { registerService } = require("../services/auth");
const { findUserByProperty } = require("../services/user");

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
const logInController = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await findUserByProperty("email", email).select("+password");
    if (!user) {
      return res.json({
        status: 404,
        message: "No user find with that email",
      });
    }
    if (user.password !== password) {
      return res.json({ status: 404, message: "password not matched" });
    } else {
      return res.json({
        status: 200,
        data: user,
      });
    }
  } catch (error) {
    return res.json({ status: 500, message: `server error ${error} ` });
  }
};

module.exports = { registerController, logInController };
