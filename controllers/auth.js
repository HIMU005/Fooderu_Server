const User = require("../models/User");

//
const registerController = async (req, res, next) => {
  return res.json({ message: "connected" });
};

// function for login user varification
const logInController = async (req, res, next) => {
  const { email, password } = req.body;

  // const findUsers = await
  try {
    const user = await User.findOne({ email }).select("+password");
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
