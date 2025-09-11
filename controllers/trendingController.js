const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");
const RestaurantFollow = require("../models/RestaurantFollow");
const Post = require("../models/Post");
const MenuItem = require("../models/MenuItem");
const Comment = require("../models/Comment");

const getTrendingRestaurants = async (req, res) => {
  try {
    const userId = req.user._id;

    // Last 7 days
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 7);

    // 1. Get followers in last 7 days
    const followers = await RestaurantFollow.aggregate([
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

    // 2. Get comments and replies from last 7 days
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

    // 3. Get ratings from last 7 days
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
    addScore(followers, (i) => i.newFollowers * 3); // Followers are most valuable
    addScore(comments, (i) => i.totalComments * 2); // Comments show good engagement
    addScore(
      ratings,
      (i) =>
        i.totalRatings * 1 + // Each rating contributes
        i.avgRating * 0.5 // Higher average ratings get bonus
    );

    // Sort restaurants by score
    const sortedRestaurants = [...scoreMap.entries()]
      .sort((a, b) => b[1].score - a[1].score)
      .map(([id, data]) => ({ restaurant_id: id, ...data }));

    if (sortedRestaurants.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // Fetch full restaurant docs
    const restaurantDocs = await Restaurant.find({
      _id: { $in: sortedRestaurants.map((r) => r.restaurant_id) },
      status: "active",
    }).lean();

    if (restaurantDocs.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // Attach score + follow status
    const userFollows = await RestaurantFollow.find({ user_id: userId });
    const followedIds = new Set(
      userFollows.map((f) => f.restaurant_id.toString())
    );

    const restaurantMap = new Map(
      restaurantDocs.map((d) => [d._id.toString(), d])
    );

    const result = sortedRestaurants
      .filter((r) => restaurantMap.has(r.restaurant_id))
      .map((r) => ({
        ...(restaurantMap.get(r.restaurant_id) || {}),
        score: Math.round(r.score), // Round to whole number
        isFollowing: followedIds.has(r.restaurant_id),
      }));

    res.json({
      success: true,
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
module.exports = { getTrendingRestaurants };
