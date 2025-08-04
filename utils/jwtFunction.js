const jwt = require("jsonwebtoken");

// assign token with for email
const assignToken = (email) =>
  jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "4h" });

// verify token code will be here
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return decoded.email;
  } catch (error) {
    return null;
  }
};
//

module.exports = { assignToken, verifyToken };
