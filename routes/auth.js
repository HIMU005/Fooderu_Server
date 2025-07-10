const router = require("express").Router();
const {
  registerController,
  logInController,
  logInWithSocialController,
} = require("../controllers/auth");

router.post("/register", registerController);

router.get("/login", logInController);

router.post("/login_with_social", logInWithSocialController);

module.exports = router;
