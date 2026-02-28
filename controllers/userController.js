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
      message: "User profile fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUserProfile = async (req, res, next) => {
  try {
    const updates = req.body;
    if (!updates || Object.keys(updates).length === 0) {
      throw new AppError("No data provided for update", 400);
    }
    if (
      updates.email ||
      updates.password ||
      updates.user_type ||
      updates.verified ||
      updates.status
    ) {
      throw new AppError("Some fields are not allowed to update", 400);
    }

    // check the location
    if (updates.location) {
      const { coordinates } = updates.location;

      if (coordinates) {
        const [lat, lng] = coordinates;
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          throw new AppError("Invalid location coordinated", 400);
        }
      }

      if (!Array.isArray(coordinates)) {
        throw new AppError("Location coordinates mus be an array", 400);
      }
      if (coordinates.length !== 2) {
        throw new AppError("Location coordinates must have 2 elements", 400);
      }

      if (!coordinates.every((coord) => typeof coord === "number")) {
        throw new AppError("Location coordinates must be numbers", 400);
      }

      if (updates.location.type && updates.location.type !== "Point") {
        throw new AppError("Invalid location type", 400);
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
      context: "query",
    });

    if (!user) {
      throw new AppError("No user found to update", 404);
    }
    return res.status(200).json({
      status: "success",
      data: user,
      message: "User profile updated successfully",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
