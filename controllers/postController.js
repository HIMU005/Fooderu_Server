const { default: mongoose } = require("mongoose");
const Post = require("../models/Post");
const RestaurantFollow = require("../models/RestaurantFollow");
const AppError = require("../utils/AppError");
const PostImage = require("../models/PostImage");
const PostLike = require("../models/PostLike");
const { likeAndUnlikePostService } = require("../services/postService");

const postByUser = async (req, res, next) => {
  try {
    // const { restaurant_id, description, image_url } = req.body;
    const {
      restaurant_id,
      details = {},
      media = [],
      type = "normal",
    } = req.body;
    const { description } = details;

    // return res.json({ description, resources });
    if (!restaurant_id) {
      throw new AppError("restaurant_id is required", 404);
    }

    if (!mongoose.Types.ObjectId.isValid(restaurant_id)) {
      throw new AppError("Invalid restaurant ID", 400);
    }

    if (!description && media.length === 0) {
      throw new AppError("Post must have description or media", 400);
    }

    if (restaurant_id !== req.user.restaurant_id?.toString()) {
      throw new AppError("You are not the owner of the restaurant", 403);
    }
    const newPost = await Post.create({
      restaurant_id,
      details,
      type,
    });

    // post images and videos in the PostImage collection
    var imageData = [];
    if (media.length > 0) {
      const mediaDocs = media.map((item, index) => ({
        postId: newPost._id,
        url: item.url,
        type: item.type || "image",
        isPrimary: item.isPrimary || false,
        order: item.order ?? index,
      }));
      imageData = await PostImage.insertMany(mediaDocs);
    }

    return res.json({
      status: 201,
      message: "A post is created...",
      // data: { newPost, media: imageData || [] },
    });
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
      .limit(limit)
      .populate({
        path: "media",
        options: { sort: { order: 1 } }, // Sort media by 'order' field
      });

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

    const post = await Post.findById(id).populate({
      path: "media",
      options: { sort: { order: 1 } }, // keep media ordered
    });
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
    const userId = req.user._id;
    const { details, media } = req.body;
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

    // update the details
    if (details) {
      singlePost.details = {
        ...singlePost.details,
        ...details,
      };

      await singlePost.save();
    }

    // replace media if provided
    if (Array.isArray(media)) {
      // delete old media
      await PostImage.deleteMany({ postId: id });

      if (media.length > 0) {
        const mediaDocs = media.map((item, index) => ({
          postId: id,
          url: item.url,
          type: item.type || "image",
          isPrimary: item.isPrimary || false,
          order: item.order ?? index,
        }));

        await PostImage.insertMany(mediaDocs);
      }
    }

    const updatedPost = await Post.findById(id).populate({
      path: "media",
      options: { sort: { order: 1 } },
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
    // const userId = "68b993dc1597be1c656b3bbf";
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

    // delete post media first
    await PostImage.deleteMany({ postId: id });

    // delete all the likes associated with the post
    await PostLike.deleteMany({ postId: id });

    // delete the post
    await Post.findByIdAndDelete(id);

    return res.json({ status: 200, message: "Post deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// toggle like and unlike a post
const likeAndUnlikePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req?.user?._id;

    const result = await likeAndUnlikePostService(id, userId);
    console.log(270, result);

    return res.json({
      status: "success",
      message: result.liked
        ? "Post liked successfully"
        : "Post unliked successfully",
    });
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
  likeAndUnlikePost,
};
