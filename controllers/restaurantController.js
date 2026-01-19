const { default: mongoose } = require("mongoose");
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid restaurant ID", 400);
    }
    const restaurant = await Restaurant.findById({ _id: id });

    if (!restaurant) {
      throw new AppError("No Restaurant againts that Id", 404);
    }
    return res.json({
      status: 200,
      data: restaurant,
      message: "single restaurant fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

// get all restaurants
const getAllRestaurant = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: restaurants.length,
      data: restaurants,
    });
  } catch (error) {
    next(error);
  }
};

// Owner access only
const getMyRestaurant = async (req, res, next) => {
  try {
    const restaurant = await getRestaurantById(
      req.params.id,
      req.user.id, // Pass user ID for ownership check
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
    throw new AppError("All fields are required", 400);
  }

  try {
    const owenerInfo = await User.findById(restaurantInfo.owner_id);

    if (!owenerInfo) {
      throw new AppError("Owner not found", 404);
    }

    if (owenerInfo.hasRestaurant) {
      throw new AppError("You already have a restaurant", 409);
    }

    const data = await createRestaurantService(restaurantInfo);
    if (!data) {
      throw new AppError("Failed to create restaurant", 500);
    }
    if (data.errors) {
      // console.log(data.errors);
      throw new AppError(data.errors, 400);
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
      { new: true },
    );

    return res
      .status(201)
      .json({ status: 201, message: "Restaurant created successfully", data });
  } catch (error) {
    next(error);
  }
};

// get a single restaurantInfo
const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    return res.json({
      status: 200,
      data: restaurants,
      message: "All restaurant data fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getARestaurantByTheOwerId = async (req, res, next) => {
  const { ownerId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      throw new AppError("Invalid Owner ID", 400);
    }

    const restaurantInfo = await Restaurant.findOne({ owner_id: ownerId });
    if (!restaurantInfo) {
      throw new AppError("User have no Restaurant ", 404);
    }
    return res.json({
      status: 200,
      message: "Restaurant information fetched successfully",
      data: restaurantInfo,
    });
  } catch (error) {
    next(error);
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

    return res.json({
      status: 200,
      count: restaurantsWithStatus.length,
      data: restaurantsWithStatus,
    });
  } catch (error) {
    next(error);
  }
};

// update my restaurant
const updateMyRestaurant = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      throw new AppError("Invalid restaurant ID", 400);
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new AppError("No Restaurant againts that Id", 404);
    }
    if (restaurant.owner_id.toString() !== req.user._id.toString()) {
      throw new AppError(
        "You are not the owner. Only the owner has permission ",
        403,
      );
    }
    const update = req.body;

    const updated = await Restaurant.findByIdAndUpdate(restaurantId, update, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      throw new AppError("No Restaurant againts that Id", 404);
    }
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
