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
      // throw new AppError("Name and Price are required", 400);
      return next(new AppError("Name and Price are required", 400));
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
    // console.log(error);
    next(error);
  }
};

// get all restaurants items
const getAllItemsUnderARestaurant = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const response = await getAllItemsUnderARestaurantService(restaurantId);
    res.json({ status: 200, data: response, message: "success" });
  } catch (error) {
    return next(new AppError(`Internal Server Error`, 500));
  }
};

// get all posts under a restaurant
const getAllPostsUnderARestaurant = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const posts = await Post.find({ restaurant_id: restaurantId }).sort({
      createdAt: -1,
    });

    if (!posts.length) {
      return next(new AppError("No posts found for this restaurant", 404));
    }

    return res.json({
      status: 200,
      message: "Posts fetched successfully",
      data: posts,
    });
  } catch (error) {
    return next(new AppError(`Internal Server Error`, 500));
  }
};

// post a rating for a menu item
const PostARating = async (req, res, next) => {
  try {
    const userId = req.user._id; // when the frontend wil be connected
    // const userId = "688e2ae1117148e446299150"; //himu@gmail.com
    // const userId = "688eddea1a6d8960842ce861"; // hashanuzzaman99@gmail.com
    const { menuItemId } = req.params;
    const { rating } = req.body;

    // as raing is mandatoryo and rating can't be less than 1 or greater than 5
    if (!rating || rating < 1 || rating > 5) {
      return next(new AppError("Rating must be between 1 and 5", 400));
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
    return next(new AppError(`Internal Server Error`, 500));
  }
};

// get a single menu item by its id
const GetASingleMenuItem = async (req, res, next) => {
  try {
    const { menuItemId } = req.params;
    // console.log(menuItemId);

    // 1. Check if ID format is valid to prevent CastError
    if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
      // console.log("checking monggose id validity");

      return next(new AppError("Invalid Menu Item ID format", 400));
    }

    const menuItem = await MenuItem.findById(menuItemId).populate(
      "restaurant_id",
      "name"
    );
    // console.log("menuItem", menuItem);

    if (!menuItem) {
      return next(new AppError("Menu Item not found", 404));
    }
    res.status(200).json({
      status: 200,
      data: menuItem,
      message: "Menu item fetched successfully",
    });
  } catch (error) {
    return next(new AppError(`Internal Server Error`, 500));
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
const getAllMenuItems = async (req, res, next) => {
  try {
    const { item, place, price, rating, fields = "*" } = req.query;

    const queryParams = {};

    // Validate 'fields' parameter
    if (fields && fields !== "*") {
      if (typeof fields !== "string") {
        return next(
          new AppError(
            "Invalid fields parameter format. Use comma-separated field names or '*'",
            400
          )
        );
      }
    }

    // Validate and process 'item' parameter
    if (item) {
      if (typeof item !== "string" || item.trim().length === 0) {
        return next(new AppError("Item name must be a non-empty string", 400));
      }
      queryParams.name = { $regex: item.trim(), $options: "i" };
    }

    // Validate and process 'price' parameter
    if (price) {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return next(
          new AppError("Price must be a valid non-negative number", 400)
        );
      }
      queryParams.price = { $lte: priceNum };
    }

    // Validate and process 'rating' parameter
    if (rating) {
      const ratingNum = parseFloat(rating);
      if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
        return next(
          new AppError("Rating must be a number between 0 and 5", 400)
        );
      }
      queryParams.averageRating = { $lte: ratingNum };
    }

    // Validate 'place' parameter
    if (place && (typeof place !== "string" || place.trim().length === 0)) {
      return next(new AppError("Place must be a non-empty string", 400));
    }

    // Parse requested fields
    const requestedFields =
      fields === "*" ? [] : fields.split(",").map((f) => f.trim());
    // console.log("Requested fields:", requestedFields);

    // Check if restaurant data is requested
    const needsRestaurantData = requestedFields.some(
      (field) =>
        field.includes("restaurant_id") || field.startsWith("restaurant_id.")
    );
    // console.log("needsRestaurantData", needsRestaurantData);

    // Start building query
    let query = MenuItem.find(queryParams);
    // console.log("query: ", query);

    // Only populate restaurant if needed
    if (needsRestaurantData) {
      let restaurantPopulateFields = "name displayPicture address";

      // If specific restaurant fields are requested, populate only those
      const restaurantRequestedFields = requestedFields
        .filter((f) => f.startsWith("restaurant_id."))
        .map((f) => f.replace("restaurant_id.", ""));

      // console.log("Restaurant field requests:", restaurantRequestedFields);

      if (restaurantRequestedFields.length > 0) {
        // Extract simple field names (handle nested address fields)
        const simpleFields = restaurantRequestedFields.filter(
          (f) => !f.includes(".")
        );

        if (simpleFields.length > 0) {
          restaurantPopulateFields = simpleFields.join(" ");
        }

        // console.log("Restaurant populate fields:", restaurantPopulateFields);
        query = query.populate("restaurant_id", restaurantPopulateFields);
      }
    }

    // Apply sorting
    query = query.sort({ averageRating: -1 });

    // Build field selection for query (top-level fields only)
    let fieldSelection = null;
    if (fields && fields !== "*") {
      // Filter out nested fields for mongoose select
      const topLevelFields = requestedFields.filter((f) => !f.includes("."));
      // console.log("TopLevelFields: ", topLevelFields);

      if (topLevelFields.length > 0) {
        fieldSelection = topLevelFields.join(" ");

        // Always include _id if not explicitly excluded
        if (!topLevelFields.includes("_id")) {
          fieldSelection += " _id";
        }

        // Include restaurant_id only if we need restaurant data
        if (needsRestaurantData && !topLevelFields.includes("restaurant_id")) {
          fieldSelection += " restaurant_id";
        }

        // console.log("fieldSelection: ", fieldSelection);
      }
    }

    // Apply field selection BEFORE execution
    if (fieldSelection) {
      query = query.select(fieldSelection);
    }

    // Execute the query
    let menuItems = await query.lean();

    // Apply place filter (only if we have restaurant data)
    if (place && needsRestaurantData) {
      const placeSearch = place.trim().toLowerCase();
      menuItems = menuItems.filter((item) =>
        item.restaurant_id?.address?.mapAddress
          ?.trim()
          .toLowerCase()
          .includes(placeSearch)
      );
    }

    return res.json({
      status: 200,
      data: menuItems,
      message: "All menu items fetched successfully",
    });
  } catch (error) {
    return next(new AppError(`Internal Server Error`, 500));
  }
};

const getMenuItemsByFollowedRestaurants = async (req, res, next) => {
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
      return next(new AppError("No followed restaurants found", 404));
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
    return next(new AppError(`Internal Server Error`, 500));
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
