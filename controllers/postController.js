const Post = require("../models/Posts");
const AppError = require("../utils/AppError");

const postByUser = async (req, res) => {
  const { user_id, description, photo, isEvent } = req.body;
  if (!user_id) {
    return res.json({ status: 404, message: "postId is required" });
  }
  try {
    const response = await Post.create({
      user_id,
      description,
      photo,
      isEvent,
    });
    return res.json({ status: 201, message: "A post is created..." });
  } catch (error) {
    AppError(`server error ${error} `, 500);
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
    throw new AppError(`server error ${error} `, 500);
  }
};

// get a single post details
const getASinglePost = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.findById(id);
    return res.json({
      status: 200,
      data: post,
      message: "Single post fetched",
    });
  } catch (error) {
    throw new AppError(`server error ${error} `, 500);
  }
};

module.exports = { postByUser, getAllPosts, getASinglePost };
