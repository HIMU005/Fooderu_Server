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
              { $ifNull: ["$likesCount", 0] }
            ]
          }
        }
      },

      // count comments + replies per post
      {
        $lookup: {
          from: "comments",
          let: { postId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$postId", "$$postId"] } } },
            { $project: { repliesCount: { $size: { $ifNull: ["$replies", []] } } } },
            { $group: { _id: null, count: { $sum: { $add: [1, "$repliesCount"] } } } }
          ],
          as: "commentsAgg"
        }
      },
      {
        $addFields: {
          commentsCount: { $ifNull: [{ $arrayElemAt: ["$commentsAgg.count", 0] }, 0] }
        }
      },

      // bring back minimal user info
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      // bring minimal restaurant info
      {
        $lookup: {
          from: "restaurants",
          localField: "restaurant_id",
          foreignField: "_id",
          as: "restaurant"
        }
      },
      { $unwind: { path: "$restaurant", preserveNullAndEmptyArrays: true } },

      // bring minimal menu item info
      {
        $lookup: {
          from: "menuitems",
          localField: "menuItem",
          foreignField: "_id",
          as: "menuItem"
        }
      },
      { $unwind: { path: "$menuItem", preserveNullAndEmptyArrays: true } },

      // compute score and whether current user liked the post
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ["$likesCount", 1] },
              { $multiply: ["$commentsCount", 3] }
            ]
          },
          isLikedByUser: { $in: [userObjectId, { $ifNull: ["$likes", []] }] }
        }
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
          user: { _id: "$user._id", name: "$user.name", displayPicture: "$user.displayPicture" },
          restaurant: { _id: "$restaurant._id", name: "$restaurant.name", displayPicture: "$restaurant.displayPicture" },
          menuItem: { _id: "$menuItem._id", name: "$menuItem.name", price: "$menuItem.price" }
        }
      }
    ];

    const posts = await Post.aggregate(pipeline);

    res.json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    console.error("Trending posts error:", error);
    res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
};

module.exports = { getTrendingRestaurants, getTrendingMenuItems };
