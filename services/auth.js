const bcrypt = require("bcryptjs");
const { findUserByProperty } = require("./user");
const jwt = require("jsonwebtoken");
const registerService = async ({ email, password }) => {
  const user = await userService.findUserByProperty("email", email);

  if (user) throw error("User already exists", 400);

  //   hash the password before saving it to the database
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  return userService.createNewUser({
    email,
    password: hash,
  });
};

// login service
const loginService = async (email, password) => {
  const user = await findUserByProperty("email", email).select("+password");

  // if the user is not in the database
  if (!user) {
    const err = new Error("No user found with that email");
    err.status = 404;
    throw err;
  }

  const isMatched = await bcrypt.compare(password, user.password);

  // if password not matched with the database
  if (!isMatched) {
    const err = new Error("Password not matched");
    err.status = 401;
    throw err;
  }

  user.password = undefined;
  // jwt code is here
  const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "4h",
  });
  console.log(token);

  return user;
};

module.exports = { loginService, registerService };
