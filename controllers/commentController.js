// controllers/commentController.js
const Comment = require("../models/Comment");

// Create a new comment
const addComment = async (req, res) => {
  try {
    const { postId, userId, text } = req.body;
    const newComment = new Comment({ postId, userId, text });
    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: "Failed to add comment", error });
  }
};

// Get all comments for a post
const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ postId }).populate("userId", "name profile_picture"); //add profile picture
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch comments", error });
  }
};

// Add a reply to a comment
const addReply = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId, text } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    comment.replies.push({ userId, text });
    await comment.save();

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: "Failed to add reply", error });
  }
};

module.exports = {
  addComment,
  getCommentsByPost,
  addReply,
};
