const User = require("../models/User");

const findUsers = () => {
  return User.find();
};

const findUserByProperty = async (key, value) => {
  // console.log("key", key);
  // console.log("value", value);

  let user = null;
  if (key === "_id") {
    user = await User.findById(value).select("+password");
    return user;
  }

  user = await User.findOne({ [key]: value }).select("+password");

  return user;
};

const createNewUser = async ({ email, password }) => {
  const user = new User({
    email,
    password,
    location: {
      type: "Point",
      coordinates: [0, 0], // Default coordinates, can be updated later
    },
  });

  await user.save();

  return user;
};

module.exports = { findUsers, findUserByProperty, createNewUser };
