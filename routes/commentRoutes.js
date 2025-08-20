const express = require("express");
const {
  addComment,
  getCommentsByPost,
  addReply,
} = require("../controllers/commentController");

const router = express.Router();

// Add comment
router.post("/", addComment);

// Get comments for a specific post
router.get("/:postId", getCommentsByPost);

// Add reply to a specific comment
router.post("/:commentId/replies", addReply);

module.exports = router;
