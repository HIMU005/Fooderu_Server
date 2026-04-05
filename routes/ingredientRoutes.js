const express = require("express");
const { getAllIngredients } = require("../controllers/ingredientController");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");

router.get("/", protect, getAllIngredients);
module.exports = router;
