const router = require("express").Router();
const authRoutes = require("./auth");
const restaurantRoutes = require("./restaurants");
const menuItemRoutes = require("./menuItemRoutes");

// auth routes
router.use("/auth", authRoutes);

// for restaurant routes
router.use("/restaurants", restaurantRoutes);

module.exports = router;
