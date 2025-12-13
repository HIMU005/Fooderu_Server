const User = require("../models/User");

const findUsers = () => {
  return User.find();
};

const findUserByProperty = async (key, value) => {
  let user = null;
  if (key === "_id") {
    user = await User.findById(value);
    return user;
  }

  user = await User.findOne({ [key]: value });
  return user;
};

const createNewUser = async ({ email, password }) => {
  const user = new User({
    email,
    password,
  });

  await user.save();

  return user;
};

module.exports = { findUsers, findUserByProperty, createNewUser };
