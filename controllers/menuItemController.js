const Restaurant = require("../models/Restaurants");
const {
  createMenuItem,
  getAllItemsUnderARestaurantService,
} = require("../services/menuItemService");
const AppError = require("../utils/AppError");

/**
 * @desc    Create a new menu item under a restaurant
 * @route   POST /restaurants/:restaurantId/items
 * @access  Private (Restaurant Owner/Admin)
 */

const createMenuItemController = async (req, res, next) => {
  try {
    const { name, price, description, image_url, is_boosted, boosted_until } =
      req.body;
    console.log(req.body);
    const { restaurantId } = req.params; console.log('restaurant id : ', restaurantId);

    if (!name || !price) {
      throw new AppError("Name and Price are required", 400);
    }

    const newItem = await createMenuItem({
      name,
      price,
      description,
      image_url,
      is_boosted,
      boosted_until,
      restaurant_id: restaurantId,
    });

    res.status(201).json({
      status: "success",
      data: newItem,
    });
  } catch (error) {
    next(error);
  }
};

// get all restaurants items
const getAllItemsUnderARestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const response = await getAllItemsUnderARestaurantService(restaurantId);
    res.json({ status: 200, data: response, message: "success" });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, message: `Server error: ${error.message}` });
  }
};

module.exports = {
  createMenuItemController,
  getAllItemsUnderARestaurant,
};
