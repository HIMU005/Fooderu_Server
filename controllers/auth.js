//
const registerController = async (req, res, next) => {
  return res.json({ message: "connected" });
};

// function for login user varification
const logInController = async (req, res, next) => {
  return res.json({ message: "connected" });
};

module.exports = { registerController, logInController };
