const Restaurant = require("../models/Restaurants");
const {
  createRestaurantService,
  getAllRestaurantsService,
} = require("../services/restaurantService");

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
    const data = await createRestaurantService(restaurantInfo);
    if (!data) {
      return res
        .status(500)
        .json({ status: 500, message: "Failed to create restaurant" });
    }
    if (data.errors) {
      return res.status(400).json({ status: 400, message: data.errors });
    }
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

module.exports = {
  createRestaurant,
  getAllRestaurants,
};
