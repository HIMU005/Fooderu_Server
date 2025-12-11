const jwt = require("jsonwebtoken");
const AppError = require("./AppError");

// assign token with for email
const assignToken = (id, email) => {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new AppError("ACCESS_TOKEN_SECRET is not defined");
  }

  return jwt.sign({ id, email }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "4h",
  });
};

// verify token code will be here
const verifyToken = (token) => {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new AppError("ACCESS_TOKEN_SECRET is not defined");
  }

  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    // console.error("Token verification error:", error);
    return null;
  }
};
//

module.exports = { assignToken, verifyToken };
