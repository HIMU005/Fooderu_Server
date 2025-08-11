const express = require("express");
const { postByUser, getAllPosts } = require("../controllers/postController");
const router = express.Router();

// POST  a post by user
router.post("/", postByUser);

router.get("/", getAllPosts);

module.exports = router;
