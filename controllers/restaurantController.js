const Restaurant = require("../models/Restaurants");
const User = require("../models/User");
const {
  createRestaurantService,
  getAllRestaurantsService,
  getRestaurantById,
} = require("../services/restaurantService");
const AppError = require("../utils/AppError");

// Public access
const getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await getRestaurantById(req.params.id);
    res.status(200).json({
      status: "success",
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
};

// get all restaurants
const getAllRestaurant = async (req, res, next) => {
  try {
    const restaurants = Restaurant.find();

    res.status(200).json({
      status: "success",
      results: restaurants.length,
      data: restaurants,
    });
  } catch (error) {
    console.error("Error getting restaurants: ", error);
    res.status(500).json({
      status: "fail",
      message: "Server error",
      error: error.message,
    });
  }
};

// Owner access only
const getMyRestaurant = async (req, res, next) => {
  try {
    const restaurant = await getRestaurantById(
      req.params.id,
      req.user.id // Pass user ID for ownership check
    );
    res.status(200).json({
      status: "success",
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
};

const createRestaurant = async (req, res, next) => {
  const { restaurantInfo } = req.body;

  if (
    !restaurantInfo ||
    !restaurantInfo.owner_id ||
    !restaurantInfo.name ||
    !restaurantInfo.registration_no ||
    !restaurantInfo.phone ||
    !restaurantInfo.address ||
    !restaurantInfo.description
  ) {
    return res
      .status(400)
      .json({ status: 400, message: "All fields are required" });
  }

  try {
    const owenerInfo = await User.findById(restaurantInfo.owner_id);
    if (owenerInfo.hasRestaurant) {
      return res.json({
        status: 409,
        message: "You have already a restaurant........",
      });
    }
    const data = await createRestaurantService(restaurantInfo);
    if (!data) {
      return res
        .status(500)
        .json({ status: 500, message: "Failed to create restaurant" });
    }
    if (data.errors) {
      return res.status(400).json({ status: 400, message: data.errors });
    }

    // update user info
    const updateUserInfo = await User.findByIdAndUpdate(
      data.owner_id,
      {
        $set: {
          restaurant_id: data._id,
          hasRestaurant: true,
        },
      },
      { new: true }
    );

    return res
      .status(201)
      .json({ status: 201, message: "Restaurant created successfully", data });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: `Server error: ${error.message}` });
  }
};

// get a single restaurantInfo
const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    return res.json({
      status: 200,
      data: restaurants,
      message: "All restaurant data fetched successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: `Server error: ${error.message}` });
  }
};

const getARestaurantByTheOwerId = async (req, res) => {
  const { ownerId } = req.params;
  try {
    const restaurantInfo = await Restaurant.findOne({ owner_id: ownerId });
    if (!restaurantInfo) {
      return res.json({ status: 404, message: "User have no restaurant" });
    }
    return res.json({
      status: 200,
      message: "Restaurant information fetched successfully",
      data: restaurantInfo,
    });
  } catch (error) {
    return res.json({ status: 500, message: `server errro!! ${error}` });
  }
};

// follows a restaurant by a user
const followController = async (req, res) => {
  const userId = req.user._id;
  const restaurantId = req.restaurant.id;

  console.log(userId, restaurantId);

  try {
    // Check if already followed
    const user = await User.findById(userId);
    if (user.followRestaurants.includes(restaurantId)) {
      return res
        .status(400)
        .json({ message: "Already following this restaurant." });
    }

    // Add restaurant to user's follow list
    await user.findByIdAndUpdate(userId, {
      $addToSet: { followRestaurants: restaurantId },
    });

    // Add user to restaurant's followed list
    await Restaurant.findById(restaurantId, {
      $addToSet: { followedBy: userId },
    });

    res.status(200).json({ message: "Restaurant followed successfully." });
  } catch (error) {
    console.error("follow Error: ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const unfollowRestaurant = async (req, res) => {
  try {
    const userId = req.user._id;
    const restaurantId = req.params.id;

    const user = await User.findById(userId);
    if (!user.followRestaurants.includes(restaurantId)) {
      return res
        .status(400)
        .json({ message: "Not following this restaurant." });
    }

    // Remove restaurant from user's follow list
    await User.findByIdAndUpdate(userId, {
      $pull: { followRestaurants: restaurantId },
    });

    // Remove user from restaurant's followedBy list
    await Restaurant.findByIdAndUpdate(restaurantId, {
      $pull: { followedBy: userId },
    });

    res.status(200).json({ message: "Restaurant unfollowed successfully." });
  } catch (error) {
    console.error("Unfollow error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  createRestaurant,
  getAllRestaurants,
  getRestaurant,
  getMyRestaurant,
  getARestaurantByTheOwerId,
  followController,
  unfollowRestaurant,
  getAllRestaurant,
};
