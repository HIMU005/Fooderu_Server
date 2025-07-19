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
    console.log('got menu item from front end ', req.body);
    const { restaurantId } = req.params;
    console.log('restaurant id' , restaurantId);

    if (!name || !price) {
      console.log('no name or nor price ');
      throw new AppError("Name and Price are required", 400);
    }

    const newItem = await createMenuItem(
      {
        name,
        price,
        description,
        image_url,
        is_boosted,
        boosted_until,
        restaurant_id: restaurantId,
      },
      restaurantId
    );

    res.status(201).json({
      status: "success",
      data: newItem,
    });
  } catch (error) {
    throw new AppError(`Error: ${error.message}`, 500);
  }
};

module.exports = {
  createMenuItemController,
};
