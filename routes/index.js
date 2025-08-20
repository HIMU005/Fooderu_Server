const router = require("express").Router();
const authRoutes = require("./auth");
const restaurantRoutes = require("./restaurants");
const menuItemRoutes = require("./menuItemRoutes");
const userRoutes = require("./userRoutes");
const eventRoutes = require("./eventRoutes");
const PostRoutes = require("./postsRoutes");
const followRoutes = require("./followRoutes");
const commentRoutes = require("./commentRoutes")

// auth routes
router.use("/auth", authRoutes);

// for restaurant routes
router.use("/restaurants", restaurantRoutes);

// protected routes
router.use("/users", userRoutes);

//event routes
router.use("/restaurants/:restaurantId/events", eventRoutes);

// posts routes
router.use("/posts", PostRoutes);

// for menuItems
router.use("/menuItems", menuItemRoutes);

router.use("/follow", followRoutes);
//comment routes
router.use("/comments", commentRoutes);

module.exports = router;
