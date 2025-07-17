const { createRestaurant } = require("../controllers/restaurantController");

const router = require("express").Router();

router.post("/", createRestaurant);

module.exports = router;
