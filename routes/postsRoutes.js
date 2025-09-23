const express = require("express");
const {
  postByUser,
  getAllPosts,
  getASinglePost,
  updatePostDetails,
  deletePost,
} = require("../controllers/postController");
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();

// POST  a post by user
router.post("/", postByUser);

// get all posts
router.get("/", getAllPosts);

// get a single post
router.get("/:id", getASinglePost);

// update a post by id
router.put("/:id", protect, updatePostDetails);

// delete a post by id
router.delete("/:id", deletePost);

module.exports = router;
