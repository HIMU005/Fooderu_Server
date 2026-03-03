const express = require("express");
const {
  postByUser,
  getAllPosts,
  getASinglePost,
  updatePostDetails,
  deletePost,
  getPostsByFollowedRestaurants,
  likeAndUnlikePost,
} = require("../controllers/postController");
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();

// GET Posts by followed restaurants
router.get("/followedRestaurantsPosts", protect, getPostsByFollowedRestaurants);

// POST  a post by user
router.post("/", protect, postByUser);

// get all posts
router.get("/", protect, getAllPosts);

// get a single post
router.get("/:id", protect, getASinglePost);

// update a post by id
router.put("/:id", protect, updatePostDetails);

// delete a post by id
router.delete("/:id", protect, deletePost);

// like and unlike a post
router.post("/:id/like", protect, likeAndUnlikePost);

module.exports = router;
