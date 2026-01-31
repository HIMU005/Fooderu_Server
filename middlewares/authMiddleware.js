const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const User = require("../models/User");
const { verifyToken } = require("../utils/jwtFunction");

// In your protect middleware with throwing version:
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new AppError("Not authorized, no token", 401);
    }

    // This will throw if environment variable is missing
    const decoded = verifyToken(token);

    if (!decoded) {
      throw new AppError("Invalid or expired token", 401);
    }

    const currentUser = await User.findOne({ email: decoded.email });

    if (!currentUser) {
      throw new AppError("User not found", 401);
    }

    req.user = currentUser;
    next();
  } catch (error) {
    if (error.message.includes("not defined")) {
      // Environment variable error
      // console.error("Server configuration error:", error.message);
      throw new AppError("Server configuration error", 500);
    }
    next(error);
  }
};
