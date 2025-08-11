const express = require("express");
const {
  postByUser,
  getAllPosts,
  getASinglePost,
} = require("../controllers/postController");
const router = express.Router();

// POST  a post by user
router.post("/", postByUser);

// get all posts
router.get("/", getAllPosts);

// get a single post
router.get("/:id", getASinglePost);

module.exports = router;
