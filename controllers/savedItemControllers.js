const { default: mongoose } = require("mongoose");
const SavedItem = require("../models/SavedItem");
const MenuItem = require("../models/MenuItem");
const MenuItemImage = require("../models/MenuItemImage");
const AppError = require("../utils/AppError");

// Save an item
const saveItem = async (req, res, next) => {
  try {
    const { menuItemId } = req.body;
    const userId = req.user._id;

    if (!menuItemId) {
      throw new AppError("Menu item ID is required", 400);
    }

    // Check if menu item exists
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      throw new AppError("Menu item not found", 404);
    }

    // Check if already saved
    const existingSave = await SavedItem.findOne({ userId, menuItemId });
    if (existingSave) {
      throw new AppError("Item already saved", 400);
    }

    // Create saved item
    const savedItem = await SavedItem.create({
      userId,
      menuItemId,
    });

    // Populate menu item details (without restaurant)
    await savedItem.populate("menuItemId");

    res.status(201).json({
      status: "success",
      data: savedItem, // Direct spread, no extra nesting
    });
  } catch (error) {
    next(error);
  }
};

// Unsave an item
const unsaveItem = async (req, res, next) => {
  try {
    const { menuItemId } = req.body;
    const userId = req.user._id;

    const result = await SavedItem.findOneAndDelete({ userId, menuItemId });

    if (!result) {
      throw new AppError("Saved item not found", 404);
    }

    res.status(200).json({
      status: "success",
      message: "Item removed from saved items",
    });
  } catch (error) {
    next(error);
  }
};

// Get all saved items for a user (without pagination)
const getSavedItems = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get all saved items for the user
    const savedItems = await SavedItem.find({ userId })
      .populate("menuItemId")
      .sort({ createdAt: -1 })
      .lean();

    // Get all menu item IDs to fetch their images
    const menuItemIds = savedItems
      .map((item) => item.menuItemId?._id)
      .filter((id) => id); // Remove null/undefined

    // Fetch images for all menu items
    const images = await MenuItemImage.find({
      menuItemId: { $in: menuItemIds },
    })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    // Group images by menuItemId
    const imagesByMenuItem = {};
    images.forEach((image) => {
      if (!imagesByMenuItem[image.menuItemId]) {
        imagesByMenuItem[image.menuItemId] = [];
      }
      imagesByMenuItem[image.menuItemId].push({
        url: image.url,
      });
    });

    // Transform data for frontend
    const transformedItems = savedItems.map((item) => ({
      id: item._id,
      savedAt: item.createdAt,
      menuItem: item.menuItemId
        ? {
            id: item.menuItemId._id,
            name: item.menuItemId.name,
            description: item.menuItemId.description,
            price: item.menuItemId.price,
            images: imagesByMenuItem[item.menuItemId._id.toString()] || [], // Array of image objects
            is_boosted: item.menuItemId.is_boosted,
            averageRating: item.menuItemId.averageRating,
            totalRatings: item.menuItemId.totalRatings,
            ingredients: item.menuItemId.ingredients,
            cautions: item.menuItemId.cautions,
            isAvailable: true,
          }
        : {
            id: item.menuItemId,
            isAvailable: false,
            name: "Item no longer available",
            images: [], // Empty array for unavailable items
          },
    }));

    res.status(200).json({
      status: "success",
      results: transformedItems.length,
      data: transformedItems, // Direct spread, no savedItems wrapper
    });
  } catch (error) {
    next(error);
  }
};

// Check if a specific item is saved
const checkSaved = async (req, res, next) => {
  try {
    const { menuItemId } = req.body;
    const userId = req.user._id;

    const savedItem = await SavedItem.findOne({ userId, menuItemId });

    res.status(200).json({
      status: "success",
      data: {
        isSaved: !!savedItem,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Clear all saved items for a user
const clearAllSaved = async (req, res, next) => {
  try {
    const userId = req.user._id;

    await SavedItem.deleteMany({ userId });

    res.status(200).json({
      status: "success",
      message: "All saved items cleared successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Bonus: Get save count for an item (public route, no auth needed)
const getSaveCount = async (req, res, next) => {
  try {
    const { menuItemId } = req.params;

    const count = await SavedItem.countDocuments({ menuItemId });

    res.status(200).json({
      status: "success",
      data: {
        menuItemId,
        saveCount: count,
      },
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

// Bonus: Check multiple items save status at once
const checkBulkSaved = async (req, res, next) => {
  try {
    const { menuItemIds } = req.body;
    const userId = req.user._id;

    if (!menuItemIds || !Array.isArray(menuItemIds)) {
      throw newAppError("Please provide an array of menu item IDs", 400);
    }

    const savedItems = await SavedItem.find({
      userId,
      menuItemId: { $in: menuItemIds },
    })
      .select("menuItemId")
      .lean();

    const savedStatus = {};
    menuItemIds.forEach((id) => {
      savedStatus[id.toString()] = false;
    });

    savedItems.forEach((item) => {
      savedStatus[item.menuItemId.toString()] = true;
    });

    res.status(200).json({
      status: "success",
      data: savedStatus,
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

module.exports = {
  saveItem,
  unsaveItem,
  getSavedItems,
  checkSaved,
  clearAllSaved,
  getSaveCount,
  checkBulkSaved,
};
