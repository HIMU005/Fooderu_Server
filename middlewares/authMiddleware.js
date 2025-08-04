const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const User = require("../models/User");
const { verifyToken } = require("../utils/jwtFunction");

exports.protect = async (req, res, next) => {
  try {
    let token;

    // 1. Get token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new AppError("Not authorized", 401);
    }

    // 2. Verify token

    const decodedEmail = verifyToken(token);

    if (!decodedEmail) {
      throw new AppError("Invalid token payload", 401);
    }

    // 3. Find user by email
    const currentUser = await User.findOne({ email: decodedEmail });

    // 4. Grant access
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};
