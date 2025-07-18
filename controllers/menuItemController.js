const { createMenuItem } = require("../services/menuItemService");
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
    const { restaurantId } = req.params;

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

module.exports = {
  createMenuItemController,
};
