const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");
const RestaurantFollow = require("../models/RestaurantFollow");
const Post = require("../models/Post");
const MenuItem = require("../models/MenuItem");
const Comment = require("../models/Comment");

const getTrendingRestaurants = async (req, res) => {
  try {
    const userId = req.user._id;

    //Last 7 days
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 7);

    // followers in last 7 days
    const followers = await RestaurantFollow.aggregate([
      { $match: { followed_at: { $gte: sinceDate } } },
      { $group: { _id: "$restaurant_id", newFollowers: { $sum: 1 } } },
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

    addScore(followers, (i) => i.newFollowers * 3);

    // Sort restaurants by score
    const sortedRestaurants = [...scoreMap.entries()]
      .sort((a, b) => b[1].score - a[1].score)
      .map(([id, data]) => ({ restaurant_id: id, ...data }));

    // Fetch full restaurant docs
    const restaurantDocs = await Restaurant.find({
      _id: { $in: sortedRestaurants.map((r) => r.restaurant_id) },
    }).lean();

    // Attach score + follow status
    const userFollows = await RestaurantFollow.find({ user_id: userId });
    const followedIds = new Set(
      userFollows.map((f) => f.restaurant_id.toString())
    );

    const restaurantMap = new Map(
      restaurantDocs.map((d) => [d._id.toString(), d])
    );
    const result = sortedRestaurants.map((r) => ({
      ...(restaurantMap.get(r.restaurant_id) || {}),
      score: r.score,
      isFollowing: followedIds.has(r.restaurant_id),
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Trending error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

module.exports = { getTrendingRestaurants };
