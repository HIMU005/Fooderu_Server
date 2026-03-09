const { mongoose } = require("mongoose");
const Post = require("../models/Post");
const AppError = require("../utils/AppError");
const PostLike = require("../models/PostLike");

const likeAndUnlikePostService = async (postId, userId) => {
  // not valid post id
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw new AppError("Invalid post ID", 400);
  }

  const post = await Post.findById(postId);

  // not found post with the id
  if (!post) {
    throw new AppError("Post not found", 404);
  }

  const existingLike = await PostLike.findOne({ postId, userId });
  if (existingLike) {
    // unlike the post
    await PostLike.findByIdAndDelete(existingLike._id);
    return {
      status: "success",
      message: "Post unliked successfully",
      liked: false,
    };
  } else {
    // like the post
    await PostLike.create({ postId, userId });
    return {
      status: "success",
      message: "Post liked successfully",
      liked: true,
    };
  }
};

module.exports = {
  likeAndUnlikePostService,
};
