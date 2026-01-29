const Restaurant = require("../models/Restaurant");
const AppError = require("../utils/AppError");

const getRestaurantById = async (restaurantId, userId = null) => {
  try {
    // Base query
    const query = { _id: restaurantId };

    // If userId is provided, verify ownership
    if (userId) {
      query.owner_id = userId;
    }

    const restaurant = await Restaurant.findOne(query)
      .populate("owner_id", "name email profile_picture")
      .populate("menu_items");

    if (!restaurant) {
      // throw new AppError(
      //   userId
      //     ? "You dont own a restaurant with that ID"
      //     : "Restaurant not found",
      //   404
      // );
      return next(
        new AppError(
          userId
            ? "You dont own a restaurant with that ID"
            : "Restaurant not found",
          404
        )
      );
    }

    return restaurant;
  } catch (error) {
    // Handle CastError for invalid ObjectId
    if (error.name === "CastError") {
      // throw new AppError("Invalid restaurant ID", 400);
      return next(new AppError("Invalid restaurant ID", 400));
    }
  }
  return next(new AppError(`Failed to get restaurant: ${error.message}`, 400));
};

const createRestaurantService = async (restaurantInfo) => {
  try {
    const response = await Restaurant.create(restaurantInfo);
    return response;
  } catch (error) {
    return {
      errors: error.message,
    };
  }
};

module.exports = {
  createRestaurantService,
  getRestaurantById,
};
