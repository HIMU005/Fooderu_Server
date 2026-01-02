const router = require("express").Router();
const {
  registerController,
  logInController,
  logInWithSocialController,
  logInWithClerkcontroller,
  loginWithFirebaseController,
  verifyEmailController,
  ressendVerificationEmailController,
} = require("../controllers/auth");

router.post("/register", registerController);

router.post("/login", logInController);

router.post("/login_with_social", logInWithSocialController);

router.post("/login_with_clerk", logInWithClerkcontroller);

router.post("/login_with_firebase", loginWithFirebaseController);

router.get("/verify_email", verifyEmailController);

router.get("/resend_verification_email", ressendVerificationEmailController);

module.exports = router;
