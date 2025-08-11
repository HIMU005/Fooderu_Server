const express = require("express");
const { postByUser } = require("../controllers/postController");
const router = express.Router();

// POST  a post by user
router.post("/", postByUser);

module.exports = router;
