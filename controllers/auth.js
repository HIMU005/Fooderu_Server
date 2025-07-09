const { registerService } = require("../services/auth");

const registerController = async (req, res, next) => {
  const { email, password } = req.body;

  //   validation
  if (!email || !password) {
    throw error("Invalid data", 400);
  }

  try {
    const user = await registerService({
      email,
      password,
    });

    return res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerController };
