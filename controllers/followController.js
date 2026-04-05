// controllers/followController.js
const RestaurantFollow = require("../models/RestaurantFollow");
const Restaurant = require("../models/Restaurant");
const mongoose = require("mongoose");
const AppError = require("../utils/AppError");

const toggleFollow = async (req, res, next) => {
  const { restaurantId } = req.params;
  const userId = req.user._id;

  // Validate restaurant exists (quick check without full document)
  const restaurantExists = await Restaurant.exists({ _id: restaurantId });
  if (!restaurantExists) {
    throw new AppError("Restaurant not found", 404);
  }

  // Check current follow status
  const isFollowing = await RestaurantFollow.exists({
    user_id: userId,
    restaurant_id: restaurantId,
  });

  try {
    if (isFollowing) {
      await RestaurantFollow.deleteOne({
        user_id: userId,
        restaurant_id: restaurantId,
      });
    } else {
      await RestaurantFollow.create({
        user_id: userId,
        restaurant_id: restaurantId,
      });
    }

    // Get updated count (this could be optimized further)
    const followersCount = await RestaurantFollow.countDocuments({
      restaurant_id: restaurantId,
    });

    res.status(200).json({
      success: true,
      isFollowing: !isFollowing,
      followersCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggleFollow,
};
