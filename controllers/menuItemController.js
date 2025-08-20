const { default: mongoose } = require("mongoose");
const MenuItemRating = require("../models/MenuItemRating");
const Restaurant = require("../models/Restaurant");
const {
  createMenuItem,
  getAllItemsUnderARestaurantService,
} = require("../services/menuItemService");
const AppError = require("../utils/AppError");
const MenuItem = require("../models/MenuItem");

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
    const { restaurantId } = req.params;
    console.log("restaurant id : ", restaurantId);

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

// post a rating for a menu item
// TODO MAKE IT PROTECTED
const PostARating = async (req, res) => {
  try {
    const userId = req.user._id; // when the frontend wil be connected
    // const userId = "688e2ae1117148e446299150"; //himu@gmail.com
    // const userId = "688eddea1a6d8960842ce861"; // hashanuzzaman99@gmail.com
    const { menuItemId } = req.params;
    const { rating } = req.body;

    // as raing is mandatoryo and rating can't be less than 1 or greater than 5
    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }
    // create and update rating of the menu item here
    await MenuItemRating.findOneAndUpdate(
      {
        user: userId,
        menuItem: menuItemId,
      },
      {
        rating,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
    // create or update is done here

    // recalculate average rating here
    const agg = await MenuItemRating.aggregate([
      {
        $match: { menuItem: new mongoose.Types.ObjectId(menuItemId) },
      },
      {
        $group: {
          _id: "$menuItem",
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    // calculation done here

    // if it is aggregated update the rating of the menu item
    const menu = await MenuItem.findByIdAndUpdate(menuItemId, {
      averageRating: agg[0]?.averageRating || 0,
      totalRatings: agg[0]?.totalRatings || 0,
    });
    console.log(menu);

    // if all is successfull then return success response
    return res.json({
      status: 200,
      message: "Thansks for your rating.",
      // data: menu,
    });
  } catch (error) {
    return res.json({ status: 500, message: `Server error: ${error.message}` });
  }
};

// get a single menu item by its id
const GetASingleMenuItem = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const menuItem = await MenuItem.findById(menuItemId).populate(
      "restaurant_id",
      "name"
    );

    if (!menuItem) {
      return res.json({ status: 404, message: "Menu item not found" });
    }
    res.json({
      status: 200,
      data: menuItem,
      message: "Menu item fetched successfully",
    });
  } catch (error) {
    return res.json({ status: 500, message: `Server error: ${error.message}` });
  }
};

// get the rating number by the logged in user
const GetMyRating = async (req, res) => {
  try {
    const userId = req.user._id;
    // const userId = "688eddea1a6d8960842ce861";
    const { menuItemId } = req.params;

    const rating = await MenuItemRating.findOne({
      user: userId,
      menuItem: menuItemId,
    });
    // .populate("menuItem", "name price image_url averageRating totalRatings");

    // if no rating found for this user and menu item by this user
    if (!rating) {
      return res.json({
        status: 404,
        message: "Rating not found for this menu item by this user",
      });
    }
    // rturn the rating
    res.json({
      status: 200,
      data: rating,
      message: "Rating fetched for the item by this user successfully done",
    });
  } catch (error) {
    return res.json({ status: 500, message: `Server error: ${error.message}` });
  }
};

// get all the menuItems
const getAllMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find().populate(
      "restaurant_id",
      "name displayPicture"
    );

    return res.json({
      status: 200,
      data: menuItems,
      message: "All menu items fetched successfully",
    });
  } catch (error) {
    return res.json({ status: 500, message: `Server error: ${error.message}` });
  }
};

module.exports = {
  createMenuItemController,
  getAllItemsUnderARestaurant,
  PostARating,
  GetASingleMenuItem,
  GetMyRating,
  getAllMenuItems,
};
