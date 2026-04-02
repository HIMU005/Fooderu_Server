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
      if (isNaN(cursorDate.getTime())) {
        queryConditions.createdAt = { $lt: cursorDate };
      }
    }

    // Fetch items from both collections with cursor condition
    const [posts, menuItems] = await Promise.all([
      // Posts query with cursor
      Post.aggregate([
        { $match: queryConditions },
        { $sort: { createdAt: -1 } },
        { $limit: limit * 2 }, // Fetch extra to account for merging
        ...getPostImageLookupStages(),
        ...getPostLikeLookupStages(userId),
      ]),

      // MenuItems query with cursor
      MenuItem.aggregate([
        { $match: queryConditions },
        { $sort: { createdAt: -1 } },
        { $limit: limit * 2 },
        ...getRestaurantLookupStages(),
        ...getImagePipelineStages(includeImages),
        ...getMenuItemRatingLookupStages(userId),
      ]),
    ]);

    // Combine and sort
    const combinedFeeds = [...posts, ...menuItems];
    combinedFeeds.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Take exactly what we need
    const paginatedFeeds = combinedFeeds.slice(0, limit);

    // Get next cursor (timestamp of last item)
    const nextCursor =
      paginatedFeeds.length === limit
        ? paginatedFeeds[paginatedFeeds.length - 1].createdAt
        : null;

    // Check if there are more items
    let hasMore = false;
    if (nextCursor) {
      // Quick check if more items exist
      const [morePosts, moreMenuItems] = await Promise.all([
        Post.findOne({ createdAt: { $lt: nextCursor } }).select("_id"),
        MenuItem.findOne({
          createdAt: { $lt: nextCursor },
        }).select("_id"),
      ]);
      hasMore = !!(morePosts || moreMenuItems);
    }

    res.json({
      status: 200,
      data: paginatedFeeds,
      pagination: {
        nextCursor,
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
