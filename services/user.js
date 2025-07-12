const User = require("../models/User");

const findUsers = () => {
  return User.find();
};

const findUserByProperty = (key, value) => {
  if (key === "_id") {
    return User.findById(value);
  }

  return User.findOne({ [key]: value });
};

const createNewUser = ({ email, password }) => {
  const user = new User({
    email,
    password,
  });

  return user.save();
};

module.exports = { findUsers, findUserByProperty, createNewUser };
