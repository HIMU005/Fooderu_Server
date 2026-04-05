const express = require("express");
const { searchController } = require("../controllers/searchController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, searchController);

module.exports = router;
