const express = require("express");
const { getAllCaution } = require("../controllers/cautionController");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");

router.get("/", protect, getAllCaution);

module.exports = router;
