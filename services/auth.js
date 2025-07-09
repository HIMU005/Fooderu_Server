const userService = require("./user");
const bcrypt = require("bcryptjs");

const registerService = async (email, password) => {
  const user = await userService.findUserByProperty("email", email);

  if (user) throw error("User already exists", 400);

  //   hash the password before saving it to the database
  const salt = await bcrypt.getSalt(10);
  const hash = await bcrypt.hash(password, salt);

  return userService.createNewUser({
    email,
    password: hash,
  });
};

module.exports = { registerService };
