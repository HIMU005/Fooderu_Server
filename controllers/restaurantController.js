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

module.exports = {
  createRestaurant,
  getAllRestaurants,
  getRestaurant,
  getMyRestaurant,
  getARestaurantByTheOwerId,
};
