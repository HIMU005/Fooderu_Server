const { default: mongoose } = require("mongoose");
const MenuItemRating = require("../models/MenuItemRating");
const Restaurant = require("../models/Restaurant");
const {
  createMenuItem,
  getAllItemsUnderARestaurantService,
} = require("../services/menuItemService");
const AppError = require("../utils/AppError");
const MenuItem = require("../models/MenuItem");
const RestaurantFollow = require("../models/RestaurantFollow");
const Post = require("../models/Post");

/**
 * @desc    Create a new menu item under a restaurant
 * @route   POST /restaurants/:restaurantId/items
 * @access  Private (Restaurant Owner/Admin)
 */

const createMenuItemController = async (req, res, next) => {
  try {
    const {
      name,
      price,
      description,
      image_url,
      is_boosted,
      boosted_until,
      isPost,
    } = req.body;
    // console.log(req.body);
    const { restaurantId } = req.params;
    // console.log("restaurant id : ", restaurantId);

    if (!name || !price) {
      throw new AppError("Name and Price are required", 400);
    }
    if (name.length > 100) {
      return res.json({
        status: 400,
        message: "Name cannot exceed 100 characters",
      });
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
    if (isPost) {
      const details = { name, price, description, image_url };
      const postType = "menuItem";
      const post = await Post.create({
        details,
        postType,
        restaurant_id: restaurantId,
      });
    }

    res.status(201).json({
      status: "success",
      data: newItem,
    });
  } catch (error) {
    console.log(error);
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

// get all posts under a restaurant
const getAllPostsUnderARestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const posts = await Post.find({ restaurant_id: restaurantId }).sort({
      createdAt: -1,
    });

    if (!posts.length) {
      return res.json({
        status: 404,
        message: "No posts found for this restaurant",
        data: [],
      });
    }

    return res.json({
      status: 200,
      message: "Posts fetched successfully",
      data: posts,
    });
  } catch (error) {
    return res.json({ status: 500, message: `Server error: ${error.message}` });
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
    // console.log(menu);

    // if all is successfull then return success response
    return res.json({
      status: 200,
      message: "Thansks for your rating.",
      averageRating: agg[0]?.averageRating || 0,
      totalRatings: agg[0]?.totalRatings || 0,
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
        data: { rating: 0 },
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
    const { item, place, price, rating } = req.query;

    const queryParams = {};

    if (item) {
      queryParams.name = { $regex: item, $options: "i" }; // now not case sensitive
    }
    if (price) {
      queryParams.price = { $lte: Number(price) };
    }
    if (rating) {
      queryParams.averageRating = { $lte: Number(rating) };
    }

    let menuItems = await MenuItem.find(queryParams)
      .populate("restaurant_id", "name displayPicture address")
      .sort({ averageRating: -1 }) // sort by highest rating
      .lean();

    if (place) {
      menuItems = menuItems.filter((item) =>
        item.restaurant_id?.address?.mapAddress
          ?.trim()
          .toLowerCase()
          .includes(place.trim().toLowerCase())
      );
    }

    return res.json({
      status: 200,
      data: menuItems,
      message: "All menu items fetched successfully",
    });
  } catch (error) {
    return res.json({ status: 500, message: `Server error: ${error.message}` });
  }
};

const getMenuItemsByFollowedRestaurants = async (req, res) => {
  try {
    const userId = req.user._id;

    // find all the restaurants followed by this user
    const followedRestaurants = await RestaurantFollow.find({
      user_id: userId,
    })
      .select("restaurant_id")
      .sort({ createdAt: -1 })
      .lean();
    // if no restaurants is followed then return an empty array
    if (!followedRestaurants.length) {
      return res.json({
        status: 200,
        data: [],
        message: "No follwed restaurants, so no menu items found",
      });
    }

    // map all  the restaurants ids
    const followedIds = followedRestaurants.map((f) => f.restaurant_id);

    // find all the menu items from the restaurants that are followed by this user
    const menuItems = await MenuItem.find({
      restaurant_id: { $in: followedIds },
    })
      .populate("restaurant_id", "name displayPicture address")
      .lean();

    // console.log(menuItems);

    return res.json({
      status: 200,
      data: menuItems,
      message: "Menu items from followed restaurants fetched successfully",
    });
  } catch (error) {
    return res.json({ status: 500, message: `Server error: ${error.message}` });
  }
};

// update menuITems
const updateMenuItem = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const updateData = req.body;
    const userId = req.user._id;
    // const userId = "68b993dc1597be1c656b3bbf";

    const menuItem = await MenuItem.findById(menuItemId).populate(
      "restaurant_id",
      "owner_id"
    );

    if (!menuItem) {
      return res.json({ status: 404, message: "Menu item not found" });
    }

    if (menuItem?.restaurant_id?.owner_id.toString() !== userId.toString()) {
      return res.json({
        staus: 403,
        message: "Only the owner of the restaurant can update the menu item",
      });
    }

    const newMenuItem = await MenuItem.findByIdAndUpdate(
      menuItemId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate("restaurant_id");

    return res.json({
      status: 200,
      message: "Menuitem update successfully",
      data: newMenuItem,
    });
  } catch (error) {
    return res.json({ status: 500, message: `Server error: ${error.message}` });
  }
};

// delete menuItem
const deleteMenuItem = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const userId = req.user._id;
    // const userId = "68b993dc1597be1c656b3bbf";

    const menuItem = await MenuItem.findById(menuItemId).populate(
      "restaurant_id",
      "owner_id"
    );

    if (!menuItem) {
      return res.json({ status: 404, message: "Menu item not found" });
    }

    if (menuItem?.restaurant_id?.owner_id.toString() !== userId.toString()) {
      return res.json({
        staus: 403,
        message: "Only the owner of the restaurant can delete the menu item",
      });
    }
    await MenuItem.findByIdAndDelete(menuItemId);
    return res.json({ status: 200, message: "MenuItem deleted successfully" });
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
  getMenuItemsByFollowedRestaurants,
  updateMenuItem,
  deleteMenuItem,
  getAllPostsUnderARestaurant,
};
