const Restaurant = require("../models/Restaurant");
const RestaurantFollow = require("../models/RestaurantFollow");
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
    const id = req.params.restaurantId || req.params.id;
    const restaurant = await Restaurant.findById({ _id: id });
    res.status(200).json({
      status: "success",
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// get all restaurants
const getAllRestaurant = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find();

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
  const restaurantInfo = req.body;
  if (
    !restaurantInfo ||
    !restaurantInfo.owner_id ||
    !restaurantInfo.name ||
    !restaurantInfo.registration_no ||
    !restaurantInfo.phone ||
    !restaurantInfo.address ||
    !restaurantInfo.description ||
    !restaurantInfo.location
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
      // console.log(data.errors);

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

// controllers/restaurantController.js
const getRestaurantsWithFollowStatus = async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware
    // the search item from the query parameter
    const { item, place } = req.query;

    const queryParams = {}; // configure the query parameters

    if (item) {
      queryParams.name = { $regex: item, $options: "i" }; // now not case sensitive
    }

    // Place filter (match city or country)
    if (place) {
      queryParams["address.mapAddress"] = { $regex: place, $options: "i" };
    }

    // 1. Get all restaurants
    const restaurants = await Restaurant.find(queryParams).lean();

    // 2. Get all follow relationships for this user at once (more efficient)
    const userFollows = await RestaurantFollow.find({
      user_id: userId,
    }).select("restaurant_id -_id");

    const userFollowsMap = new Map();
    userFollows.forEach((follow) => {
      userFollowsMap.set(follow.restaurant_id.toString(), true);
    });

    // 3. Get followers count for all restaurants at once
    const followersCounts = await RestaurantFollow.aggregate([
      {
        $group: {
          _id: "$restaurant_id",
          count: { $sum: 1 },
        },
      },
    ]);

    const followersCountMap = new Map();
    followersCounts.forEach((item) => {
      followersCountMap.set(item._id.toString(), item.count);
    });

    // 4. Combine the data
    const restaurantsWithStatus = restaurants.map((restaurant) => ({
      ...restaurant,
      isFollowing: userFollowsMap.has(restaurant._id.toString()),
      followersCount: followersCountMap.get(restaurant._id.toString()) || 0,
    }));

    res.status(200).json({
      success: true,
      count: restaurantsWithStatus.length,
      data: restaurantsWithStatus,
    });
  } catch (error) {
    console.error("Error getting restaurants with follow status:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// update my restaurant
const updateMyRestaurant = async (req, res, next) => {
  // console.log("hit");
  try {
    const restaurantId = req.params.restaurantId;
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return next(new AppError("No restaurant found with that Id", 404));
    }
    if (restaurant.owner_id.toString() !== req.user._id.toString()) {
      return next(
        new AppError(
          "You do not have permission to update this restaurant",
          403
        )
      );
    }
    const update = req.body;
    // console.log(update);
    await Restaurant.findByIdAndUpdate(restaurantId, update, {
      new: true,
      runValidators: true,
    });
    return res.json({ status: 200, message: "Restaurant updated" });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  createRestaurant,
  getAllRestaurants,
  getRestaurant,
  getMyRestaurant,
  getARestaurantByTheOwerId,
  getAllRestaurant,
  getRestaurantsWithFollowStatus,
  updateMyRestaurant,
};
