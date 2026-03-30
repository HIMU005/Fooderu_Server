const { default: mongoose } = require("mongoose");
const MenuItemRating = require("../models/MenuItemRating");
const MenuItemImage = require("../models/MenuItemImage");
const Restaurant = require("../models/Restaurant");
const {
  createMenuItem,
  getAllItemsUnderARestaurantService,
} = require("../services/menuItemService");
const AppError = require("../utils/AppError");
const MenuItem = require("../models/MenuItem");
const RestaurantFollow = require("../models/RestaurantFollow");
const Post = require("../models/Post");
const {
  uploadMultipleToImageKit,
  formatUploadResponse,
} = require("../services/imageService");

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
      images,
      is_boosted,
      boosted_until,
      isPost,
      ingredients,
      cautions,
    } = req.body;

    const { restaurantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      throw new AppError("Invalid Restaurant ID format", 400);
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      throw new AppError("Restaurant not found", 404);
    }

    const userId = req.user._id;
    if (restaurant.owner_id.toString() !== userId.toString()) {
      throw new AppError(
        "Only the owner of the restaurant can add menu items",
        403,
      );
    }

    if (!name || !price) {
      throw new AppError("Name and Price are required", 400);
    }

    if (name.length > 100) {
      throw new AppError("Name cannot exceed 100 characters", 400);
    }

    if (images) {
      const arrayOfStrings =
        Array.isArray(images) &&
        images.every((image) => typeof image === "string");

      if (!arrayOfStrings) {
        throw new AppError("Images must be Array of Strings", 400);
      }
    }

    const newItem = await createMenuItem({
      name,
      price,
      description,
      images,
      is_boosted,
      boosted_until,
      restaurant_id: restaurantId,
      ingredients,
      cautions,
    });

    if (isPost) {
      const details = { name, price, description, images };
      const postType = "menuItem";
      const post = await Post.create({
        details,
        postType,
        restaurant_id: restaurantId,
      });
    }

    res.status(201).json({
      status: "success",
      message: "Menu item created successfully",
      data: newItem.menuItem,
      images: newItem.images,
    });
  } catch (error) {
    console.error("Error in createMenuItemController:", error);
    next(error);
  }
};

// get all restaurants items
const getAllItemsUnderARestaurant = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      throw new AppError("Invalid Restaurant ID format", 400);
    }

    const response = await getAllItemsUnderARestaurantService(restaurantId);
    res.status(200).json({
      status: "success",
      data: response,
      message: "All menu items fetched successfully under a restaurant",
    });
  } catch (error) {
    next(error);
  }
};

// get all posts under a restaurant
const getAllPostsUnderARestaurant = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      throw new AppError("Invalid Restaurant ID format", 400);
    }

    const posts = await Post.find({ restaurant_id: restaurantId }).sort({
      createdAt: -1,
    });

    if (!posts.length) {
      return res.status(200).json({
        status: "success",
        message: "No posts found for this restaurant",
        data: posts,
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Posts fetched successfully",
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

// post a rating for a menu item
const PostARating = async (req, res, next) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const { menuItemId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
      throw new AppError("Invalid Menu Item ID format", 400);
    }

    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      throw new AppError("Rating must be between 1 and 5", 400);
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
      },
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
    return res.status(200).json({
      status: "success",
      message: "Thanks for your rating.",
      averageRating: agg[0]?.averageRating || 0,
      totalRatings: agg[0]?.totalRatings || 0,
    });
  } catch (error) {
    next(error);
  }
};

// get a single menu item by its id
const GetASingleMenuItem = async (req, res, next) => {
  try {
    const { menuItemId } = req.params;
    const { includeImages = "false" } = req.query;

    // 1. Check if ID format is valid to prevent CastError
    if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
      throw new AppError("Invalid Menu Item ID format", 400);
    }

    const shouldIncludeImages = includeImages.toLowerCase() === "true";

    // Build Agregation Pipeline
    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(menuItemId) } },

      // Lookup restaurant details
      {
        $lookup: {
          from: "restaurants",
          localField: "restaurant_id",
          foreignField: "_id",
          as: "restaurant_id",
        },
      },
      {
        $addFields: {
          restaurant_id: { $arrayElemAt: ["$restaurant_id", 0] },
        },
      },
    ];

    // Lookup Images if requested
    if (shouldIncludeImages) {
      pipeline.push({
        $lookup: {
          from: "menuitemimages",
          localField: "_id",
          foreignField: "menuItemId",
          as: "images",
        },
      });

      // Sort Images by order and transform to just URLs
      pipeline.push({
        $addFields: {
          images: {
            $map: {
              input: {
                $sortArray: {
                  input: "$images",
                  sortBy: { order: 1, createdAt: 1 },
                },
              },
              as: "img",
              in: "$$img.url",
            },
          },
        },
      });
    } else {
      pipeline.push({
        $addFields: {
          images: [],
        },
      });
    }

    const menuItems = await MenuItem.aggregate(pipeline);
    const menuItem = menuItems[0];

    if (!menuItem) {
      throw new AppError("Menu Item not found", 404);
    }
    res.status(200).json({
      status: 200,
      data: menuItem,
      message: "Menu item fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

// get the rating number by the logged in user
const GetMyRating = async (req, res) => {
  try {
    const userId = req.user._id;

    const { menuItemId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
      throw new AppError("Invalid Menu Item ID format", 400);
    }

    const rating = await MenuItemRating.findOne({
      user: userId,
      menuItem: menuItemId,
    });
    // .populate("menuItem", "name price image_url averageRating totalRatings");

    // if no rating found for this user and menu item by this user
    if (!rating) {
      throw new AppError(
        "Rating not found for this menu item by this user",
        404,
      );
    }
    // rturn the rating
    res.status(200).json({
      status: "success",
      data: rating,
      message: "Rating fetched for the item by this user successfully done",
    });
  } catch (error) {
    next(error);
  }
};

// get all the menuItems

/*
const getAllMenuItems = async (req, res, next) => {
  try {
    const {
      item,
      place,
      price,
      rating,
      fields = "*",
      includeImages = "false",
    } = req.query;

    const queryParams = {};

    // Validate 'fields' parameter
    if (fields && fields !== "*") {
      if (typeof fields !== "string") {
        throw new AppError(
          "Invalid fields parameter format. Use comma-separated field names or '*'",
          400,
        );
      }
    }

    // Validate and process 'item' parameter
    if (item) {
      if (typeof item !== "string" || item.trim().length === 0) {
        throw new AppError("Item name must be a non-empty string", 400);
      }
      queryParams.name = { $regex: item.trim(), $options: "i" };
    }

    // Validate and process 'price' parameter
    if (price) {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        throw new AppError("Price must be a valid non-negative number", 400);
      }
      queryParams.price = { $lte: priceNum };
    }

    // Validate and process 'rating' parameter
    if (rating) {
      const ratingNum = parseFloat(rating);
      if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
        throw new AppError("Rating must be a number between 0 and 5", 400);
      }
      queryParams.averageRating = { $lte: ratingNum };
    }

    // Validate 'place' parameter
    if (place && (typeof place !== "string" || place.trim().length === 0)) {
      throw new AppError("Place must be a non-empty string", 400);
    }

    // validate includeImages parameter
    const shouldIncludeImages = includeImages.toLowerCase() === "true";

    // Parse requested fields
    const requestedFields =
      fields === "*" ? [] : fields.split(",").map((f) => f.trim());

    // Check if restaurant data is requested
    const needsRestaurantData = requestedFields.some(
      (field) =>
        field.includes("restaurant_id") || field.startsWith("restaurant_id."),
    );

    // Start building query
    let query = MenuItem.find(queryParams);

    // Only populate restaurant if needed
    if (needsRestaurantData) {
      let restaurantPopulateFields = "name displayPicture address";

      // If specific restaurant fields are requested, populate only those
      const restaurantRequestedFields = requestedFields
        .filter((f) => f.startsWith("restaurant_id."))
        .map((f) => f.replace("restaurant_id.", ""));

      if (restaurantRequestedFields.length > 0) {
        // Extract simple field names (handle nested address fields)
        const simpleFields = restaurantRequestedFields.filter(
          (f) => !f.includes("."),
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
          .includes(placeSearch),
      );
    }

    return res.status(200).json({
      status: "success",
      data: menuItems,
      message: "All menu items fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};
*/

// Using Aggregation Pipeline for better performance and flexibility in filtering, sorting, and field selection
const getAllMenuItems = async (req, res, next) => {
  try {
    const {
      item,
      place,
      price,
      rating,
      fields = "*",
      includeImages = "false",
    } = req.query;

    const userId = req.user?._id;

    // Initialize Aggregation Pipeline
    const pipeline = [];

    // ============= STAGE 1: Match =============
    const matchStage = {};

    // Validate and match item parameter
    if (item) {
      if (typeof item !== "string" || item.trim().length === 0) {
        throw new AppError("Item name must be a non-empty string", 400);
      }
      matchStage.name = { $regex: item.trim(), $options: "i" };
    }

    // Validate and match price parameter
    if (price) {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        throw new AppError("Price must be a valid non-negative number", 400);
      }

      matchStage.price = { $lte: priceNum };
    }

    // Validate and match rating parameter
    if (rating) {
      const ratingNum = parseFloat(rating);
      if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
        throw new AppError("Rating must be a number between 0 and 5", 400);
      }

      matchStage.averageRating = { $lte: ratingNum };
    }

    // Only add $match if we have filters
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // ============= STAGE 2: Sort =============
    pipeline.push({ $sort: { averageRating: -1, createdAt: -1 } });

    // ============= STAGE 3: Lookup Restaurant =============
    // We need restaurant data for place filtering and if requested in fields
    const needsRestaurantData =
      fields === "*" ||
      (fields && fields.split(",").some((f) => f.includes("restaurant_id")));

    // Always lookup restaurant if place filter is present or restaurant data is needed
    if (place || needsRestaurantData) {
      pipeline.push({
        $lookup: {
          from: "restaurants",
          localField: "restaurant_id",
          foreignField: "_id",
          as: "restaurant_id", // TODO: need to change it as restaurant
        },
      });

      pipeline.push({
        $addFields: {
          restaurant_id: { $arrayElemAt: ["$restaurant_id", 0] },
        },
      });

      // Apply place filter if provided
      if (place) {
        if (typeof place !== "string" || place.trim().length === 0) {
          throw new AppError("Place must be a non-empty string", 400);
        }

        pipeline.push({
          $match: {
            "restaurant_id.address.mapAddress": {
              $regex: place.trim(),
              $options: "i",
            },
          },
        });
      }
    }

    // ============= STAGE 4: Lookup Images (if requested) =============

    const shouldIncludeImages = includeImages.toLowerCase() === "true";

    if (shouldIncludeImages) {
      pipeline.push({
        $lookup: {
          from: "menuitemimages",
          localField: "_id",
          foreignField: "menuItemId",
          as: "images",
        },
      });

      // Transform images array to just URLs, sorted by order
      pipeline.push({
        $addFields: {
          images: {
            $map: {
              input: {
                $sortArray: {
                  input: "$images",
                  sortBy: { order: 1, createdAt: 1 },
                },
              },
              as: "img",
              in: "$$img.url",
            },
          },
        },
      });
    } else {
      // Add empty images array when not requested
      pipeline.push({
        $addFields: {
          images: [],
          image_url: "$image_url",
        },
      });
    }

    if (userId) {
      pipeline.push({
        $lookup: {
          from: "menuitemratings",
          let: { menuItemId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$menuItem", "$$menuItemId"] },
                    { $eq: ["$user", new mongoose.Types.ObjectId(userId)] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "userRating",
        },
      });

      pipeline.push({
        $addFields: {
          isRated: { $gt: [{ $size: "$userRating" }, 0] },
          myRating: { $arrayElemAt: ["$userRating.rating", 0] },
        },
      });

      // remove userRating from response
      pipeline.push({
        $project: { userRating: 0 },
      });
    }

    // ============= STAGE 5: Field Selection =============
    if (fields && fields !== "*") {
      if (typeof fields !== "string") {
        throw new AppError("Fields must be a string", 400);
      }

      const requestedFields = fields.split(",").map((f) => f.trim());
      const projection = {
        _id: 1, // Always include _id
      };

      // Add requested top-level fields
      requestedFields.forEach((field) => {
        if (!field.includes(".")) {
          projection[field] = 1;
        }
      });

      // Always include images and image_url for backward compatibility
      if (shouldIncludeImages) {
        projection.images = 1;
        projection.image_url = 1;
      }

      // Handle restaurant_id nested fields
      const restaurantFields = requestedFields
        .filter((f) => f.startsWith("restaurant_id."))
        .map((f) => f.replace("restaurant_id.", ""));

      if (restaurantFields.length > 0 || needsRestaurantData) {
        projection.restaurant_id = {};

        // Always include _id for restaurant
        projection.restaurant_id._id = 1;

        // Add requested restaurant fields
        restaurantFields.forEach((field) => {
          if (!field.includes(".")) {
            projection.restaurant_id[field] = 1;
          }
        });
      }

      pipeline.push({ $project: projection });
    }

    // ============= Execute Pipeline =============
    let menuItems = [];
    if (pipeline.length === 0) {
      menuItems = await MenuItem.find();
    } else {
      menuItems = await MenuItem.aggregate(pipeline);
    }

    return res.status(200).json({
      status: "success",
      data: menuItems,
      message: "All menu items fetched successfully",
    });
  } catch (error) {
    next(error);
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
      // return next(new AppError("No followed restaurants found", 404));
      throw new AppError("No followed restaurants found", 404);
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

    return res.status(200).json({
      status: "success",
      data: menuItems,
      message: "Menu items from followed restaurants fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

// update menuITems
const updateMenuItem = async (req, res, next) => {
  try {
    const { menuItemId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
      throw new AppError("Invalid Menu Item ID format", 400);
    }

    const updateData = req.body;
    const userId = req.user._id;

    const menuItem = await MenuItem.findById(menuItemId).populate(
      "restaurant_id",
      "owner_id",
    );

    if (!menuItem) {
      // return res.json({ status: 404, message: "Menu item not found" });
      throw new AppError("Menu item not found", 404);
    }

    if (menuItem?.restaurant_id?.owner_id.toString() !== userId.toString()) {
      throw new AppError(
        "Only the owner of the restaurant can update the menu item",
        403,
      );
    }

    const newMenuItem = await MenuItem.findByIdAndUpdate(
      menuItemId,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    ).populate("restaurant_id");

    return res.status(200).json({
      status: "success",
      message: "Menuitem update successfully",
      data: newMenuItem,
    });
  } catch (error) {
    next(error);
  }
};

// delete menuItem
const deleteMenuItem = async (req, res, next) => {
  try {
    const { menuItemId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
      throw new AppError("Invalid Menu Item ID format", 400);
    }

    const userId = req.user._id;

    const menuItem = await MenuItem.findById(menuItemId).populate(
      "restaurant_id",
      "owner_id",
    );

    if (!menuItem) {
      // return res.json({ status: 404, message: "Menu item not found" });
      throw new AppError("Menu item not found", 404);
    }

    if (menuItem?.restaurant_id?.owner_id.toString() !== userId.toString()) {
      // return res.json({
      //   staus: 403,
      //   message: "Only the owner of the restaurant can delete the menu item",
      // });
      throw new AppError(
        "Only the owner of the restaurant can delete the menu item",
        403,
      );
    }
    await MenuItem.findByIdAndDelete(menuItemId);
    return res.status(200).json({
      status: "success",
      message: "MenuItem deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const uploadMenuImages = async (req, res, next) => {
  try {
    const { menuItemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
      throw new AppError("Invalid Menu Item ID format", 400);
    }

    if (!menuItemId) {
      throw new AppError("Menu Item ID is required", 400);
    }

    const files = req.files || (req.file ? [req.file] : []);

    if (!files || files.length === 0) {
      throw new AppError("No files uploaded", 400);
    }

    // check if menuItem exists
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      throw new AppError("Menu Item not found", 404);
    }

    // TODO:check if the logged in user is the owner of the restaurant that this menu item belongs to

    // For now only one time a user can upload images under a single menu-item. Need to work on it later
    const ifAlreadyHasImages = await MenuItemImage.findOne({ menuItemId });
    if (ifAlreadyHasImages) {
      throw new AppError(
        "Images for this menu item already exist. Multiple uploads are not allowed currently.",
        400,
      );
    }

    const uploadResults = await uploadMultipleToImageKit(files);

    // Check if any uploads succeeded
    if (uploadResults.successCount === 0) {
      return res.status(500).json({
        success: false,
        message: "All uploads failed",
        errors: uploadResults.failedUploads.map((f) => ({
          name: f.name,
          error: f.error,
        })),
      });
    }

    const imageDocs = uploadResults.successfulUploads.map((result, index) => ({
      menuItemId,
      url: result.url,
      isPrimary: index === 0, // Set the first uploaded image as primary
      order: index, // Set order based on upload sequence
    }));

    const savedImages = await MenuItemImage.insertMany(imageDocs);

    const response = {
      success: true,
      message: `Successfully uploaded and saved ${savedImages.length} image(s)`,
      data: {
        menuItemId,
        images: savedImages.map((img) => ({
          _id: img._id,
          url: img.url,
          isPrimary: img.isPrimary,
          order: img.order,
          createdAt: img.createdAt,
        })),
      },
    };
    const statusCode = uploadResults.failedCount === files.length ? 500 : 201;

    return res.status(statusCode).json(response);
  } catch (error) {
    next(error);
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
  uploadMenuImages,
};
