const mongoose = require("mongoose");
const Post = require("../models/Post");
const MenuItem = require("../models/MenuItem");
const PostLike = require("../models/PostLike");
const {
  getRestaurantLookupStages,
  getImagePipelineStages,
  getPostImageLookupStages,
  getPostLikeLookupStages,
  getMenuItemRatingLookupStages,
} = require("../utils/aggregationHelpers");

/**
 * Get feed for infinite scrolling using cursor-based pagination
 * This ensures consistent ordering and no duplicates/missing items
 */
const getAllFeeds = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const cursor = req.query.cursor; // ISO date string of last item
    const userId = req?.user?._id;
    const includeImages = req.query.includeImages === "true";

    // Build query conditions for cursor-based pagination
    const queryConditions = {};
    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        queryConditions.createdAt = { $lt: cursorDate };
      }
    }

    // Fetch items from both collections with cursor condition
    const [posts, menuItems] = await Promise.all([
      Post.aggregate([
        { $match: queryConditions },
        { $sort: { createdAt: -1 } },
        { $limit: limit + 1 }, // Fetch one extra to check for more items
        ...getPostImageLookupStages(),
        ...getPostLikeLookupStages(userId),
      ]),

      MenuItem.aggregate([
        { $match: queryConditions },
        { $sort: { createdAt: -1 } },
        { $limit: limit + 1 }, // Fetch one extra to check for more items
        ...getRestaurantLookupStages(),
        ...getImagePipelineStages(includeImages),
        ...getMenuItemRatingLookupStages(userId),
      ]),
    ]);

    // Combine and sort
    const combinedFeeds = [...posts, ...menuItems];
    combinedFeeds.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Check if we have more items
    const hasMore = combinedFeeds.length > limit;

    // Take only what we need (limit items)
    const paginatedFeeds = combinedFeeds.slice(0, limit);

    // Get next cursor (timestamp of last item in current page)
    const nextCursor =
      paginatedFeeds.length > 0
        ? paginatedFeeds[paginatedFeeds.length - 1].createdAt
        : null;

    // Important: Convert to ISO string for consistency
    const nextCursorString = nextCursor
      ? new Date(nextCursor).toISOString()
      : null;

    res.json({
      status: 200,
      data: paginatedFeeds,
      pagination: {
        nextCursor: nextCursorString,
        hasMore,
        limit,
      },
      message: "Feed fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching feed:", error);
    next(error);
  }
};

module.exports = {
  getAllFeeds,
};
