const MenuItem = require("../models/MenuItem");
const Restaurant = require("../models/Restaurant");
const MenuItemImage = require("../models/MenuItemImage");
const Ingredient = require("../models/Ingredient");
const Caution = require("../models/Caution");
const AppError = require("../utils/AppError");

/**
 * Create a new menu item under a restaurant
 * @param {Object} itemData - Menu item data
 * @param {string} restaurantId - Parent restaurant ID
 * @returns {Promise<MenuItem>} Created menu item
 */

const createMenuItem = async (itemData) => {
  // Extract images first
  const images = itemData.images || [];
  const image_url = images[0] || null; // Handle case when no images

  // Remove images from itemData for menu item creation
  const { images: _, ...rest } = itemData;

  try {
    const menuItem = await MenuItem.create({
      ...rest,
      image_url,
    });

    // save images in MenuItemImage collection
    if (images && images.length > 0) {
      const menuItemImages = images.map((url, index) => {
        return {
          menuItemId: menuItem._id,
          url,
          isPrimary: index === 0, // first image is primary
          order: index,
        };
      });

      await MenuItemImage.insertMany(menuItemImages);
    }

    if (itemData.ingredients && itemData.ingredients.length > 0) {
      const ingredientOps = itemData.ingredients.map((ingredient) => ({
        updateOne: {
          filter: { name: ingredient },
          update: { $setOnInsert: { name: ingredient } }, // Only insert if not exists
          upsert: true, // Create if doesn't exist
        },
      }));

      await Ingredient.bulkWrite(ingredientOps);
    }

    if (itemData.cautions && itemData.cautions.length > 0) {
      const cautionOps = itemData.cautions.map((caution) => ({
        updateOne: {
          filter: {
            name: caution,
          },
          update: {
            $setOnInsert: {
              name: caution,
            },
          },
          upsert: true,
        },
      }));

      await Caution.bulkWrite(cautionOps);
    }

    return { menuItem, images };
  } catch (error) {
    throw new AppError(`Failed to create menu Item: ${error.message}`, 500);
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
    })
      .sort({ createdAt: -1 })
      .populate("restaurant_id");

    if (response.length === 0 || !response) {
      throw new AppError("No menu items found for this restaurant", 404);
    }

    return response;
  } catch (error) {
    throw new AppError(`Failed to get menu Items: ${error.message}`, 500);
  }
};

module.exports = { createMenuItem, getAllItemsUnderARestaurantService };
