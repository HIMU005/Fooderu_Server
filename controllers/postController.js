const { default: mongoose } = require("mongoose");
const Post = require("../models/Post");
const RestaurantFollow = require("../models/RestaurantFollow");
const AppError = require("../utils/AppError");

const postByUser = async (req, res, next) => {
  try {
    const { restaurant_id, description, image_url } = req.body;
    if (!restaurant_id) {
      throw new AppError("restaurant_id is required", 404);
    }
    // if (typeof isEvent !== "boolean") {
    //   return res.json({ status: 422, message: "Unprocessable Entity" });
    // }
    if (!mongoose.Types.ObjectId.isValid(restaurant_id)) {
      throw new AppError("Invalid restaurant ID", 400);
    }

    if (!description && !image_url) {
      throw new AppError("Required items is not provided", 400);
    }

    await Post.create({
      restaurant_id,
      description,
      image_url,
      // isEvent,
    });
    return res.json({ status: 201, message: "A post is created..." });
  } catch (error) {
    next(error);
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
    next(error);
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
    (fr) => fr.restaurant_id,
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
    next(error);
  }
};

// get a single post details
const getASinglePost = async (req, res, next) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid post ID", 400);
    }

    const post = await Post.findById(id);
    if (!post) {
      throw new AppError("Post not found", 404);
    }
    return res.json({
      status: 200,
      data: post,
      message: "Single post fetched",
    });
  } catch (error) {
    next(error);
  }
};

// update postDetails by id by the restaurant owner
const updatePostDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError("Invalid post ID", 400));
    }
    const updateData = req.body;
    const userId = req.user._id;
    // const userId = "68b9b5178e9b3b4eaa03a438";

    const singlePost = await Post.findById(id).populate(
      "restaurant_id",
      "owner_id",
    );

    if (!singlePost) {
      throw new AppError("Post not found", 404);
    }

    if (singlePost?.restaurant_id?.owner_id.toString() !== userId.toString()) {
      throw new AppError(
        "Only the owner of the restaurant can update the post",
        403,
      );
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
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid post ID", 400);
    }
    const userId = req.user._id;
    console.log("userId:", userId,id);
    // const userId = "68b9b5178e9b3b4eaa03a438";
    const singlePost = await Post.findById(id).populate(
      "restaurant_id",
      "owner_id",
    );

    if (!singlePost) {
      throw new AppError("Post not found", 404);
    }

    if (singlePost?.restaurant_id?.owner_id.toString() !== userId.toString()) {
      throw new AppError(
        "Only the owner of the restaurant can delete the post",
        403,
      );
    }
    // delete the post
    await Post.findByIdAndDelete(id);

    return res.json({ status: 200, message: "Post deleted successfully" });
  } catch (error) {
    next(error);
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
