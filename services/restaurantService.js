const Restaurant = require("../models/Restaurants");

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
};
