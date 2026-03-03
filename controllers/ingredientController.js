const Ingredient = require("../models/Ingredient");

const getAllIngredients = async (req, res, next) => {
  try {
    const ingredients = await Ingredient.find().select("name");
    return res.json({
      status: "success",
      data: ingredients,
      message: "all ingredients fetched",
    });
  } catch (error) {
    next();
  }
};

module.exports = { getAllIngredients };
