const jwt = require("jsonwebtoken");
const AppError = require("./AppError");

// assign token with for email
const assignToken = (id, email) => {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    // throw new Error("ACCESS_TOKEN_SECRET is not defined");
    return next(new AppError("ACCESS_TOKEN_SECRET is not defined", 500));
  }

  return jwt.sign({ id, email }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "4h",
  });
};

// generate verification token (expires in 24 hours)
const generateVerificationToken = (id, email) => {
  if (!process.env.VERIFICATION_TOKEN_SECRET) {
    // throw new Error("VERIFICATION_TOKEN_SECRET is not defined");
    return next(new AppError("VERIFICATION_TOKEN_SECRET is not defined", 500));
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
    // throw new Error("ACCESS_TOKEN_SECRET is not defined");
    return next(new AppError("ACCESS_TOKEN_SECRET is not defined", 500));
  }

  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    // Return null for invalid tokens, let the caller handle the error
    return null;
  }
};

// verify email verification token
const verifyVerificationToken = (token) => {
  if (!process.env.VERIFICATION_TOKEN_SECRET) {
    // throw new Error("VERIFICATION_TOKEN_SECRET is not defined");
    return next(new AppError("VERIFICATION_TOKEN_SECRET is not defined", 500));
  }

  try {
    const decoded = jwt.verify(token, process.env.VERIFICATION_TOKEN_SECRET);

    if (decoded.type !== "email_verification") {
      return null; // Invalid token type
    }

    return decoded;
  } catch (error) {
    // Return null for invalid/expired tokens
    return null;
  }
};

module.exports = {
  assignToken,
  verifyToken,
  generateVerificationToken,
  verifyVerificationToken,
};
