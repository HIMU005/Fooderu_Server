const Post = require("../models/Post");
const RestaurantFollow = require("../models/RestaurantFollow");
const AppError = require("../utils/AppError");

const postByUser = async (req, res) => {
  const { restaurant_id, description, image_url, isEvent } = req.body;
  if (!restaurant_id) {
    return res.json({ status: 404, message: "restaurant_id is required" });
  }
  try {
    const response = await Post.create({
      restaurant_id,
      description,
      image_url,
      isEvent,
    });
    return res.json({ status: 201, message: "A post is created..." });
  } catch (error) {
    console.error(error);

    throw new AppError(`server error ${error} `, 500);
  }
};

// get all posts
const getAllPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5; // Default limit to 5 if not provided
    const skip = parseInt(req.query.skip) || 0; // Default skip to 0 if not provided

    const totalPosts = await Post.countDocuments();

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      status: 200,
      data: posts,
      total: totalPosts,
      skip,
      limit,
      message: "Posts fetched successfully",
    });
  } catch (error) {
    console.error(error);

    throw new AppError(`server error ${error} `, 500);
  }
};

const getPostsByFollowedRestaurants = async (req, res) => {
  const userId = req.user._id;

  const followedRestaurants = await RestaurantFollow.find({ user_id: userId })
    .select("restaurant_id")
    .sort({ createdAt: -1 })
    .lean();

  if (followedRestaurants.length === 0) {
    return res.json({
      status: 200,
      data: [],
      message: "No followed restaurants found",
    });
  }

  const followedRestaurantIds = followedRestaurants.map(
    (fr) => fr.restaurant_id
  );

  try {
    const posts = await Post.find({
      restaurant_id: { $in: followedRestaurantIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      status: 200,
      data: posts,
      message: "Posts from followed restaurants fetched successfully",
    });
  } catch (error) {
    console.error(error);
    return res.json({ status: 500, message: `Server error: ${error.message}` });
  }
};

// get a single post details
const getASinglePost = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.json({ status: 404, message: "Post not found" });
    }
    return res.json({
      status: 200,
      data: post,
      message: "Single post fetched",
    });
  } catch (error) {
    throw new AppError(`server error ${error} `, 500);
  }
};

// update postDetails by id by the restaurant owner
const updatePostDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id;
    // const userId = "68b9b5178e9b3b4eaa03a438";

    const singlePost = await Post.findById(id).populate(
      "restaurant_id",
      "owner_id"
    );

    if (!singlePost) {
      return res.json({ status: 404, message: "Post not found" });
    }

    if (singlePost?.restaurant_id?.owner_id.toString() !== userId.toString()) {
      return res.json({
        status: 403,
        message: "Only the owner of the restaurant can update the post",
      });
    }

    const updatedPost = await Post.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.json({
      status: 200,
      message: "Post  updated successfully",
      data: updatedPost,
    });
  } catch (error) {
    return res.json({ status: 500, message: `Server error: ${error.message}` });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    // const userId = "68b993dc1597be1c656b3bbf";
    const singlePost = await Post.findById(id).populate(
      "restaurant_id",
      "owner_id"
    );

    if (!singlePost) {
      return res.json({ status: 404, message: "Post not found" });
    }

    if (singlePost?.restaurant_id?.owner_id.toString() !== userId.toString()) {
      return res.json({
        status: 403,
        message: "Only the owner of the restaurant can update the post",
      });
    }
    // delete the post
    await Post.findByIdAndDelete(id);

    return res.json({ status: 200, message: "MenuItem deleted successfully" });
  } catch (error) {
    return res.json({ status: 500, message: `Server error: ${error.message}` });
  }
};

module.exports = {
  postByUser,
  getAllPosts,
  getASinglePost,
  updatePostDetails,
  deletePost,
  getPostsByFollowedRestaurants,
};
