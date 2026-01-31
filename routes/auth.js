const router = require("express").Router();
const {
  registerControllerWeb,
  logInController,
  logInWithSocialController,
  logInWithClerkcontroller,
  loginWithFirebaseController,
  verifyEmailController,
  ressendVerificationEmailController,
  registerControllerOTP,
  verifyOTPController,
  resendOTPController,
  forgetPasswordController,
  verifyResetPasswordOTPController,
  resetPasswordController,
} = require("../controllers/auth");

router.post("/register", registerControllerWeb);

router.post("/login", logInController);

router.post("/login_with_social", logInWithSocialController);

router.post("/login_with_clerk", logInWithClerkcontroller);

router.post("/login_with_firebase", loginWithFirebaseController);

router.get("/verify_email", verifyEmailController);

router.get("/resend_verification_email", ressendVerificationEmailController);

// OTP based registration
router.post("/register_otp", registerControllerOTP);

// OTP verification
router.post("/verify_otp", verifyOTPController);

// Resend OTP
router.post("/resend_otp", resendOTPController);

// forget password
router.post("/forget_password", forgetPasswordController);

// verify reset password OTP
router.post("/verify_reset_password_otp", verifyResetPasswordOTPController);

// reset password
router.post("/reset_password", resetPasswordController);

module.exports = router;
