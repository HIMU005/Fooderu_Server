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

const createNewUser = ({
  email,
  password,
  verification_token,
  verification_token_expires_in,
}) => {
  const user = new User({
    email,
    password,
    verification_token,
    verification_token_expires_in,
  });

  return user.save();
};

module.exports = { findUsers, findUserByProperty, createNewUser };
