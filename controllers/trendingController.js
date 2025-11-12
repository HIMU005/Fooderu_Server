// controllers/trendingController.js
const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");
const RestaurantFollow = require("../models/RestaurantFollow");
const Post = require("../models/Post");

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

const getTrendingPosts = async (req, res) => {
  try {
    const { limit = 20, timeWindow = 168 } = req.query;

    //("Query parameters:", { limit, timeWindow });

    const sinceDate = new Date();
    sinceDate.setHours(sinceDate.getHours() - parseInt(timeWindow));
    //("Since date:", sinceDate);

    // Debug each stage step by step
    const pipeline = [
      // Stage 1: Check initial post match
      {
        $match: {
          createdAt: { $gte: sinceDate },
          postType: { $in: ["normal", "menuItem"] },
        },
      },
    ];

    // Check how many posts match the initial criteria
    const initialPosts = await Post.aggregate([
      ...pipeline,
      { $count: "total" },
    ]);
    //("Posts matching date and type:", initialPosts);

    if (initialPosts.length === 0 || initialPosts[0].total === 0) {
      //("No posts found in the specified time window. Checking all posts...");

      // Check if there are any posts at all
      const allPostsCount = await Post.countDocuments();
      //("Total posts in database:", allPostsCount);

      const samplePosts = await Post.find().limit(2);
      //("Sample posts:", samplePosts);

      // Try without time filter
      pipeline[0].$match = {
        postType: { $in: ["normal", "menuItem"] },
      };
    }

    // Continue with the full pipeline
    pipeline.push(
      // Lookup restaurant data
      {
        $lookup: {
          from: "restaurants",
          localField: "restaurant_id",
          foreignField: "_id",
          as: "restaurant",
        },
      },
      { $unwind: { path: "$restaurant", preserveNullAndEmptyArrays: true } },

      // Lookup ALL comments (not just recent ones) for debugging
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "postId",
          as: "allComments",
        },
      },

      // Lookup restaurant followers
      {
        $lookup: {
          from: "restaurantfollows",
          localField: "restaurant_id",
          foreignField: "restaurant_id",
          as: "restaurantFollowers",
        },
      },

      // Calculate metrics with debug info
      {
        $addFields: {
          hoursSincePost: {
            $divide: [
              { $subtract: [new Date(), "$createdAt"] },
              1000 * 60 * 60,
            ],
          },
          // Use both recent and all comments for comparison
          recentCommentsCount: { $size: "$allComments" }, // Simplified for now
          restaurantFollowersCount: { $size: "$restaurantFollowers" },
          likesCount: { $ifNull: ["$likes", 0] },

          // Debug: Check what values we have
          debug: {
            hasLikesField: { $ifNull: ["$likes", "FIELD_MISSING"] },
            commentsCount: { $size: "$allComments" },
            followersCount: { $size: "$restaurantFollowers" },
            postAgeHours: {
              $divide: [
                { $subtract: [new Date(), "$createdAt"] },
                1000 * 60 * 60,
              ],
            },
          },
        },
      },

      // Enhanced scoring algorithm (simplified)
      {
        $addFields: {
          baseScore: {
            $add: [
              { $multiply: ["$likesCount", 0.3] },
              { $multiply: ["$recentCommentsCount", 0.8] },
              { $multiply: ["$restaurantFollowersCount", 0.15] },
              {
                $cond: [{ $eq: ["$postType", "menuItem"] }, 2.0, 1.0],
              },
            ],
          },
          timeDecay: {
            $exp: {
              $multiply: [-0.01, "$hoursSincePost"],
            },
          },
        },
      },
      {
        $addFields: {
          trendingScore: {
            $multiply: ["$baseScore", "$timeDecay"],
          },
        },
      },

      // Debug: See scores before filtering
      {
        $addFields: {
          debugScore: {
            baseScore: { $round: ["$baseScore", 2] },
            timeDecay: { $round: ["$timeDecay", 3] },
            finalScore: { $round: ["$trendingScore", 2] },
            passesFilter: { $gt: ["$trendingScore", 0.1] },
          },
        },
      },

      // Project only the fields you need in your desired format
      {
        $project: {
          // Post basic info
          postType: 1,
          details: 1,
          createdAt: 1,
          updatedAt: 1,
          // Restaurant info in the format you want
          restaurantInfo: {
            restaurant_id: "$restaurant_id",
            restaurantImage: "$restaurant.displayPicture",
          },
          // Trending data
          trendingScore: { $round: ["$trendingScore", 2] },
          engagementMetrics: {
            likes: "$likesCount",
            comments: "$recentCommentsCount",
            restaurantFollowers: "$restaurantFollowersCount",
            hoursSincePost: { $round: ["$hoursSincePost", 1] },
          },
          // Keep debug for console logging only
          debugScore: 1,
        },
      }
    );

    const allPostsWithScores = await Post.aggregate(pipeline);
    //("All posts with scores:", allPostsWithScores);

    // Now apply the filter
    const filteredPosts = allPostsWithScores.filter(
      (post) => post.trendingScore > 0
    );
    //("Posts after filtering:", filteredPosts);

    // Sort and limit
    const trendingPosts = filteredPosts
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, parseInt(limit));

    //("Final trending posts:", trendingPosts);

    // Remove debug data before sending to frontend
    const finalData = trendingPosts.map((post) => {
      const { debugScore, ...cleanPost } = post;
      return cleanPost;
    });

    // Clean response without debug data
    res.json({
      success: true,
      count: finalData.length,
      timeWindow: `${timeWindow} hours`,
      data: finalData,
    });
  } catch (error) {
    console.error("Error in enhanced trending:", error);
    res.status(500).json({
      success: false,
      error: "Server error in enhanced trending algorithm",
      details: error.message,
    });
  }
};

module.exports = { getTrendingRestaurants, getTrendingPosts };
