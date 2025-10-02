// controllers/trendingController.js
const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");
const RestaurantFollow = require("../models/RestaurantFollow");
const Post = require("../models/Post");
const MenuItem = require("../models/MenuItem");
const Comment = require("../models/Comment");
const MenuItemRating = require("../models/MenuItemRating"); // ADD THIS LINE

const getTrendingRestaurants = async (req, res) => {
  try {
    const userId = req.user._id;
    const { item, place, limit } = req.query;

    // Last 7 days
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 7);

    // Build base query for restaurants
    const restaurantQuery = { status: "active" };

    // Apply search filters if provided
    if (item) {
      restaurantQuery.name = { $regex: item, $options: "i" };
    }

    if (place) {
      restaurantQuery["address.mapAddress"] = { $regex: place, $options: "i" };
    }

    // 1. Get ALL followers count (not just recent ones)
    const allFollowersCount = await RestaurantFollow.aggregate([
      {
        $group: {
          _id: "$restaurant_id",
          followersCount: { $sum: 1 },
        },
      },
    ]);

    const followersCountMap = new Map();
    allFollowersCount.forEach((item) => {
      followersCountMap.set(item._id.toString(), item.followersCount);
    });

    // 2. Get followers in last 7 days (for trending scoring)
    const recentFollowers = await RestaurantFollow.aggregate([
      {
        $match: {
          followed_at: { $gte: sinceDate },
        },
      },
      {
        $group: {
          _id: "$restaurant_id",
          newFollowers: { $sum: 1 },
        },
      },
    ]);

    // 3. Get comments and replies from last 7 days
    const comments = await Comment.aggregate([
      {
        $match: {
          createdAt: { $gte: sinceDate },
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "postId",
          foreignField: "_id",
          as: "post",
        },
      },
      {
        $unwind: "$post",
      },
      {
        $group: {
          _id: "$post.restaurant_id",
          totalComments: {
            $sum: {
              $add: [
                1, // Count the main comment
                { $size: "$replies" }, // Count all replies
              ],
            },
          },
        },
      },
    ]);

    // 4. Get ratings from last 7 days
    const ratings = await MenuItemRating.aggregate([
      {
        $match: {
          createdAt: { $gte: sinceDate },
        },
      },
      {
        $lookup: {
          from: "menuitems",
          localField: "menuItem",
          foreignField: "_id",
          as: "menuItem",
        },
      },
      {
        $unwind: "$menuItem",
      },
      {
        $group: {
          _id: "$menuItem.restaurant_id",
          totalRatings: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
    ]);

    const scoreMap = new Map();

    function addScore(list, weightFunc) {
      list.forEach((item) => {
        const id = item._id.toString();
        const prev = scoreMap.get(id) || { score: 0 };
        scoreMap.set(id, {
          ...prev,
          ...item,
          score: prev.score + weightFunc(item),
        });
      });
    }

    // Weighted scoring system
    addScore(recentFollowers, (i) => i.newFollowers * 3);
    addScore(comments, (i) => i.totalComments * 2);
    addScore(ratings, (i) => i.totalRatings * 1 + i.avgRating * 0.5);

    // Sort restaurants by score
    const sortedRestaurants = [...scoreMap.entries()]
      .sort((a, b) => b[1].score - a[1].score)
      .map(([id, data]) => ({ restaurant_id: id, ...data }));

    if (sortedRestaurants.length === 0) {
      return res.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    // Fetch full restaurant docs with filters - THIS IS WHERE FILTERS APPLY
    const restaurantDocs = await Restaurant.find({
      _id: { $in: sortedRestaurants.map((r) => r.restaurant_id) },
      ...restaurantQuery,
    }).lean();

    if (restaurantDocs.length === 0) {
      return res.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    // Attach score + follow status + followersCount
    const userFollows = await RestaurantFollow.find({ user_id: userId });
    const followedIds = new Set(
      userFollows.map((f) => f.restaurant_id.toString())
    );

    const restaurantMap = new Map(
      restaurantDocs.map((d) => [d._id.toString(), d])
    );

    let result = sortedRestaurants
      .filter((r) => restaurantMap.has(r.restaurant_id))
      .map((r) => ({
        ...(restaurantMap.get(r.restaurant_id) || {}),
        score: Math.round(r.score),
        isFollowing: followedIds.has(r.restaurant_id),
        followersCount: followersCountMap.get(r.restaurant_id) || 0,
      }));

    // Apply limit if provided
    if (limit && !isNaN(parseInt(limit))) {
      result = result.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error("Trending error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// controllers/trendingController.js - ADD THIS FUNCTION

const getTrendingMenuItems = async (req, res) => {
  try {
    const userId = req.user._id;

    // Last 7 days
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 7);

    // 1. Get ALL menu items first
    const allMenuItems = await MenuItem.find()
      .populate("restaurant_id", "name displayPicture address")
      .lean();

    console.log("Total menu items in database:", allMenuItems.length);

    // 2. Get ratings for menu items (most important factor)
    const ratings = await MenuItemRating.aggregate([
      {
        $match: {
          createdAt: { $gte: sinceDate },
        },
      },
      {
        $group: {
          _id: "$menuItem",
          totalRatings: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
    ]);

    console.log("Menu items with recent ratings:", ratings.length);

    // 3. Get menu items that appear in posts (through comments)
    const commentedMenuItems = await Comment.aggregate([
      {
        $match: {
          createdAt: { $gte: sinceDate },
          text: { $regex: /menu|item|food|dish|tasty|delicious/i },
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "postId",
          foreignField: "_id",
          as: "post",
        },
      },
      {
        $unwind: "$post",
      },
      {
        $lookup: {
          from: "menuitems",
          localField: "post.restaurant_id",
          foreignField: "restaurant_id",
          as: "menuItems",
        },
      },
      {
        $unwind: "$menuItems",
      },
      {
        $group: {
          _id: "$menuItems._id",
          mentionCount: { $sum: 1 },
        },
      },
    ]);

    console.log("Menu items mentioned in comments:", commentedMenuItems.length);

    const scoreMap = new Map();

    function addScore(list, weightFunc) {
      list.forEach((item) => {
        const id = item._id.toString();
        const prev = scoreMap.get(id) || { score: 0 };
        scoreMap.set(id, {
          ...prev,
          ...item,
          score: prev.score + weightFunc(item),
        });
      });
    }

    // Weighted scoring for menu items
    addScore(
      ratings,
      (i) =>
        i.totalRatings * 3 + // Number of ratings
        i.avgRating * 2 // Quality of ratings
    );

    addScore(commentedMenuItems, (i) => i.mentionCount * 2); // Mentions in comments

    // Get user's rated items for personalization
    const userRatings = await MenuItemRating.find({ user: userId });
    const userRatedIds = new Set(userRatings.map((r) => r.menuItem.toString()));

    // Create result with ALL menu items, assigning zero scores to items with no engagement
    const result = allMenuItems
      .map((menuItem) => {
        const itemId = menuItem._id.toString();
        const scoreData = scoreMap.get(itemId) || { score: 0 };

        return {
          ...menuItem,
          score: Math.round(scoreData.score),
          isRatedByUser: userRatedIds.has(itemId),
          // trendingRank will be assigned after sorting
        };
      })
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .map((item, index) => ({
        ...item,
        trendingRank: index + 1, // Assign rank after sorting
      }));

    console.log("Final result count:", result.length);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Trending menu items error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

module.exports = { getTrendingRestaurants, getTrendingMenuItems };
