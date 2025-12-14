// controllers/followController.js
const RestaurantFollow = require("../models/RestaurantFollow");
const Restaurant = require("../models/Restaurant");
const mongoose = require("mongoose");

const toggleFollow = async (req, res) => {
  //   console.log(req.params);
  //   console.log(req.user);

  const { restaurantId } = req.params;
  const userId = req.user._id;

  //   console.log("toggle", restaurantId, userId);

  // Validate restaurant exists (quick check without full document)
  const restaurantExists = await Restaurant.exists({ _id: restaurantId });
  if (!restaurantExists) {
    return res
      .status(404)
      .json({ success: false, error: "Restaurant not found" });
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
    // console.error("Follow toggle error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update follow status",
    });
  }
};

module.exports = {
  toggleFollow,
};
