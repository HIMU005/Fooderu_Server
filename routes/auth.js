const router = require("express").Router();
const { registerController, logInController } = require("../controllers/auth");

router.post("/register", registerController);

router.get("/login", logInController);

module.exports = router;
