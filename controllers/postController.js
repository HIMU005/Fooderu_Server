const Post = require("../models/Post");
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
    const posts = await Post.find();
    res.json({
      status: 200,
      data: posts,
      message: "Posts fetched successfully",
    });
  } catch (error) {
    console.error(error);

    throw new AppError(`server error ${error} `, 500);
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
};
