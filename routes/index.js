const router = require("express").Router();
const authRoutes = require("./auth");
const restaurantRoutes = require("./restaurants");
const menuItemRoutes = require("./menuItemRoutes");
const userRoutes = require("./userRoutes");
const eventRoutes = require('./eventRoutes');

// auth routes
router.use("/auth", authRoutes);

// for restaurant routes
router.use("/restaurants", restaurantRoutes);

// protected routes
router.use("/users", userRoutes);

//event routes
router.use('/restaurants/:restaurantId/events', eventRoutes);

module.exports = router;
