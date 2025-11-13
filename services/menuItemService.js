const MenuItem = require("../models/MenuItem");
const Restaurant = require("../models/Restaurant");
const AppError = require("../utils/AppError");

/**
 * Create a new menu item under a restaurant
 * @param {Object} itemData - Menu item data
 * @param {string} restaurantId - Parent restaurant ID
 * @returns {Promise<MenuItem>} Created menu item
 */

const createMenuItem = async (itemData) => {
  // verify restaurant exists
  const restaurant = await Restaurant.findById(itemData.restaurant_id);
  // console.log("restaurant found indicator", restaurant);

  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }

  //   TODO:Validate boost date if provided
  // if (
  //   itemData.boosted_until &&
  //   new Date(itemData.boosted_until) <= new Date()
  // ) {
  //

  //   throw new AppError("Boost date must be in the future", 400);
  // }

  //   Create the item
  try {
    const menuItem = await MenuItem.create({
      ...itemData,
    });

    return menuItem;
  } catch (error) {
    throw new AppError(`Failed to create menu Item: ${error.message}`, 400);
  }
};

const getAllItemsUnderARestaurantService = async (restaurantId) => {
  const restaurant = await Restaurant.findById(restaurantId);

  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }

  try {
    const response = await MenuItem.find({
      restaurant_id: restaurantId,
    }).populate("restaurant_id");
    return response;
  } catch (error) {
    throw new AppError(`Failed to get menu Items: ${error.message}`, 400);
  }
};

module.exports = { createMenuItem, getAllItemsUnderARestaurantService };
