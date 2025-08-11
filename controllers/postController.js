const Post = require("../models/Posts");
const AppError = require("../utils/AppError");

const postByUser = async (req, res) => {
  const { user_id, description, photo, isEvent } = req.body;
  if (!user_id) {
    // return res.json({ status: 404, message: "postId is required" });
    AppError("postId is required", 404);
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

module.exports = { postByUser };
