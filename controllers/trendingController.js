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
    const restaurantQuery = {};
    if (item) {
      restaurantQuery.name = { $regex: item, $options: "i" };
    }
    if (place) {
      restaurantQuery["address.mapAddress"] = { $regex: place, $options: "i" };
    }

    // 1. Fetch ALL restaurants matching filters ONCE
    const allRestaurants = await Restaurant.find(restaurantQuery).lean();

    if (allRestaurants.length === 0) {
      return res.json({ success: true, data: [], count: 0 });
    }

    const restaurantIds = allRestaurants.map((r) => r._id);

    // 2. Total followers count (all time)
    const allFollowersCount = await RestaurantFollow.aggregate([
      { $match: { restaurant_id: { $in: restaurantIds } } },
      { $group: { _id: "$restaurant_id", followersCount: { $sum: 1 } } },
    ]);

    const followersCountMap = new Map();
    allFollowersCount.forEach((item) => {
      followersCountMap.set(item._id.toString(), item.followersCount);
    });

    // 3. Recent followers (last 7 days)
    const recentFollowers = await RestaurantFollow.aggregate([
      {
        $match: {
          restaurant_id: { $in: restaurantIds },
          followed_at: { $gte: sinceDate },
        },
      },
      { $group: { _id: "$restaurant_id", newFollowers: { $sum: 1 } } },
    ]);

    // 4. Comments + replies in last 7 days
    const comments = await Comment.aggregate([
      { $match: { createdAt: { $gte: sinceDate } } },
      {
        $lookup: {
          from: "posts",
          localField: "postId",
          foreignField: "_id",
          as: "post",
        },
      },
      { $unwind: "$post" },
      {
        $match: { "post.restaurant_id": { $in: restaurantIds } },
      },
      {
        $group: {
          _id: "$post.restaurant_id",
          totalComments: {
            $sum: { $add: [1, { $size: { $ifNull: ["$replies", []] } }] },
          },
        },
      },
    ]);

    // 5. Ratings in last 7 days
    const ratings = await MenuItemRating.aggregate([
      { $match: { createdAt: { $gte: sinceDate } } },
      {
        $lookup: {
          from: "menuitems",
          localField: "menuItem",
          foreignField: "_id",
          as: "menuItem",
        },
      },
      { $unwind: "$menuItem" },
      {
        $match: { "menuItem.restaurant_id": { $in: restaurantIds } },
      },
      {
        $group: {
          _id: "$menuItem.restaurant_id",
          totalRatings: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
    ]);

    // Build score map
    const scoreMap = new Map();

    const addScore = (list, weightFunc) => {
      list.forEach((item) => {
        const id = item._id.toString();
        const current = scoreMap.get(id) || { score: 0 };
        scoreMap.set(id, {
          ...current,
          ...item,
          score: current.score + weightFunc(item),
        });
      });
    };

    addScore(recentFollowers, (i) => i.newFollowers * 3);
    addScore(comments, (i) => i.totalComments * 2);
    addScore(ratings, (i) => i.totalRatings * 1 + (i.avgRating || 0) * 0.5);

    // Ensure EVERY restaurant has an entry (even score 0)
    allRestaurants.forEach((r) => {
      const id = r._id.toString();
      if (!scoreMap.has(id)) {
        scoreMap.set(id, { _id: id, score: 0 });
      }
    });

    // Sort by score descending
    const sorted = [...scoreMap.entries()]
      .sort((a, b) => b[1].score - a[1].score)
      .map(([id, data]) => ({ restaurant_id: id, ...data }));

    // User follow status
    const userFollows = await RestaurantFollow.find({
      user_id: userId,
      restaurant_id: { $in: restaurantIds },
    });
    const followedIds = new Set(
      userFollows.map((f) => f.restaurant_id.toString())
    );

    // Build final result using original allRestaurants (preserves all fields)
    const restaurantMap = new Map(
      allRestaurants.map((r) => [r._id.toString(), r])
    );

    const result = sorted.map((entry) => {
      const restaurant = restaurantMap.get(entry.restaurant_id);
      return {
        ...restaurant,
        score: Math.round(entry.score),
        isFollowing: followedIds.has(entry.restaurant_id),
        followersCount: followersCountMap.get(entry.restaurant_id) || 0,
      };
    });

    // Apply limit
    const finalResult =
      limit && !isNaN(parseInt(limit))
        ? result.slice(0, parseInt(limit))
        : result;

    res.json({
      success: true,
      count: finalResult.length,
      data: finalResult,
    });
  } catch (error) {
    console.error("Trending error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// controllers/trendingController.js - ADD THIS FUNCTION

const getTrendingMenuItems = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit =
      req.query.limit && !isNaN(parseInt(req.query.limit))
        ? parseInt(req.query.limit)
        : 50;

    // ObjectId instance for comparisons in aggregation
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Aggregate ALL posts, compute likes/comments, score and return a simple, consistent shape
    const pipeline = [
      {
        $project: {
          content: 1,
          title: 1,
          user: 1,
          restaurant_id: 1,
          menuItem: 1,
          likes: 1,
          createdAt: 1,
          likesCount: {
            $cond: [
              { $isArray: "$likes" },
              { $size: "$likes" },
              { $ifNull: ["$likesCount", 0] },
            ],
          },
        },
      },

      // count comments + replies per post
      {
        $lookup: {
          from: "comments",
          let: { postId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$postId", "$$postId"] } } },
            {
              $project: {
                repliesCount: { $size: { $ifNull: ["$replies", []] } },
              },
            },
            {
              $group: {
                _id: null,
                count: { $sum: { $add: [1, "$repliesCount"] } },
              },
            },
          ],
          as: "commentsAgg",
        },
      },
      {
        $addFields: {
          commentsCount: {
            $ifNull: [{ $arrayElemAt: ["$commentsAgg.count", 0] }, 0],
          },
        },
      },

      // bring back minimal user info
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      // bring minimal restaurant info
      {
        $lookup: {
          from: "restaurants",
          localField: "restaurant_id",
          foreignField: "_id",
          as: "restaurant",
        },
      },
      { $unwind: { path: "$restaurant", preserveNullAndEmptyArrays: true } },

      // bring minimal menu item info
      {
        $lookup: {
          from: "menuitems",
          localField: "menuItem",
          foreignField: "_id",
          as: "menuItem",
        },
      },
      { $unwind: { path: "$menuItem", preserveNullAndEmptyArrays: true } },

      // compute score and whether current user liked the post
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ["$likesCount", 1] },
              { $multiply: ["$commentsCount", 3] },
            ],
          },
          isLikedByUser: { $in: [userObjectId, { $ifNull: ["$likes", []] }] },
        },
      },

      // sort & limit
      { $sort: { score: -1, createdAt: -1 } },
      { $limit: limit },

      // final clean projection: a simple, stable response shape
      {
        $project: {
          _id: 1,
          content: 1,
          createdAt: 1,
          score: 1,
          likesCount: 1,
          commentsCount: 1,
          isLikedByUser: 1,
          user: {
            _id: "$user._id",
            name: "$user.name",
            displayPicture: "$user.displayPicture",
          },
          restaurant: {
            _id: "$restaurant._id",
            name: "$restaurant.name",
            displayPicture: "$restaurant.displayPicture",
          },
          menuItem: {
            _id: "$menuItem._id",
            name: "$menuItem.name",
            price: "$menuItem.price",
          },
        },
      },
    ];

    const posts = await Post.aggregate(pipeline);

    res.json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (error) {
    console.error("Trending posts error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

module.exports = { getTrendingRestaurants, getTrendingMenuItems };
