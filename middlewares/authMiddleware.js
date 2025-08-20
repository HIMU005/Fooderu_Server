const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const User = require("../models/User");
const { verifyToken } = require("../utils/jwtFunction");

exports.protect = async (req, res, next) => {
  try {
    let token;
    // console.log(req.headers.authorization);

    // 1. Get token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new AppError("Not authorized, no token", 401);
    }

    // 2. Verify token

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AppError("Not authorized, invalid token", 401);
    }

    const decodedEmail = decoded.email;
    const decodedId = decoded.id;

    // 3. Find user by email
    const currentUser = await User.findOne({ email: decodedEmail });

    // 4. Grant access
    req.user = currentUser;

    next();
  } catch (error) {
    console.log("Authentication error:", error);
    throw new AppError("Authentication error:", 401);
  }
};