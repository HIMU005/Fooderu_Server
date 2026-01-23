const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const AppError = require("../utils/AppError");

exports.getUserProfile = async (req, res, next) => {
  try {
    // Get user from protected route middleware (req.user)
    const user = await User.findById(req.user.id);

    if (!user) {
      // throw new AppError("User not found", 404);
      return next(new AppError("User not found", 404));
    }

    // Check if user owns a restaurant
    const restaurantCount = await Restaurant.countDocuments({
      owner_id: user.id,
    });

    res.status(200).json({
      status: "success",
      data: {
        user: {
          ...user.toObject(),
          hasRestaurant: restaurantCount > 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUserProfile = async (req, res, next) => {
  try {
    const updates = req.body;
    console.log(updates?.email);
    if (updates.email || updates.password || updates.user_type) {
      throw new AppError(
        "Email, password, and user_type updates are not allowed here.",
        400,
      );
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new AppError("No user found to update", 404);
      // return res.json({
      //   status: 404,
      //   message: "No user found to update",
      // });
    }
    return res.status(200).json({
      status: "success",
      data: user,
      message: "User profile updated successfully",
    });
    // res.json({
    //   status: 200,
    //   data: user,
    // });
  } catch (error) {
    next(error);
  }
};
