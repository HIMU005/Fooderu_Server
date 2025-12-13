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

// generate verification token (expires in 24 hours)
const generateVerificationToken = (id, email) => {
  if (!process.env.VERIFICATION_TOKEN_SECRET) {
    throw new AppError("VERIFICATION_TOKEN_SECRET is not defined");
  }

  return jwt.sign(
    {
      id,
      email,
      type: "email_verification",
    },
    process.env.VERIFICATION_TOKEN_SECRET,
    {
      expiresIn: "1h",
    }
  );
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

// verify email verification token
const verifyVerificationToken = (token) => {
  if (!process.env.VERIFICATION_TOKEN_SECRET) {
    throw new AppError("VERIFICATION_TOKEN_SECRET is not defined");
  }

  try {
    const decoded = jwt.verify(token, process.env.VERIFICATION_TOKEN_SECRET);

    if (decoded.type !== "email_verification") {
      throw new AppError("Invalid token type", 400);
      return null;
    }

    return decoded;
  } catch (error) {
    console.error("Verification token error:", error.message);
    throw new AppError("Invalid or expired verification token", 400);
    return null;
  }
};

module.exports = {
  assignToken,
  verifyToken,
  generateVerificationToken,
  verifyVerificationToken,
};
