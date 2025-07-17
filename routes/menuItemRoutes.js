const router = require("express").Router();
const {
  createMenuItemController,
} = require("../controllers/menuItemController");

router.post("/items", createMenuItemController);

module.exports = router;
