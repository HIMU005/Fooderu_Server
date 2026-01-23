const OTP = require("../models/Otp");
const User = require("../models/User");
const { generateOtp } = require("../utils/otpGenerator");
const { sendOTPEmail, sendResendOTPEmail } = require("../utils/emailService");
const AppError = require("../utils/AppError");

class OTPService {
  // Generate and send OTP
  static async generateAndSendOTP(
    email,
    purpose = "email_verification",
    req = null,
  ) {
    try {
      // Find User
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        // For security, do not reveal that user does not exist
        return {
          success: true,
          message:
            "If an account with that email exists, an OTP has been sent.",
        };
      }

      //   check if user is already verified for email verification purpose
      if (purpose === "email_verification" && user.verified) {
        throw new AppError("Email is already verified", 400);
      }

      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Create OTP document
      const otpDoc = new OTP({
        email: email.toLowerCase(),
        userId: user._id,
        otp,
        purpose,
        expiresAt,
        ipAddress: req?.ip,
        userAgent: req?.headers["user-agent"],
      });

      await otpDoc.save();

      // TODO:Update user's last OTP sent time (optional)

      //   send OTP email
      await sendOTPEmail(email, otp, user.name);
    } catch (error) {
      console.error("Error in generateAndSendOTP:", error);
      throw error;
    }
  }

  // Verify OTP
  static async verifyOTP(email, otp, purpose = "email_verification") {
    try {
      // Find valid OTP
      const otpDoc = await OTP.findValidOTP(email.toLowerCase(), otp, purpose);

      if (!otpDoc) {
        // increment attempts for tracking
        await OTP.findOneAndUpdate(
          { email: email.toLowerCase(), purpose },
          { $inc: { attempts: 1 } },
          { new: true },
        );

        throw new AppError("Invalid or expired OTP", 400);
      }

      // Check attempts (optional security measure)
      //   if (otpDoc.attempts >= 5) {
      //     throw new AppError("Too many attempts. Please request a new OTP.", 429);
      //   }

      // Mark OTP as used
      await otpDoc.markAsUsed();

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      return {
        success: true,
        message: "OTP verified successfully",
        user,
        otpId: otpDoc._id,
      };
    } catch (error) {
      console.error("Error in verifyOTP:", error);
      throw error;
    }
  }

  // Resend OTP
  static async resendOTP(email, purpose = "email_verification", req = null) {
    try {
      // Cleanup old OTPs
      await OTP.cleanup();

      // Check rate limiting
      const recentOTP = await OTP.findOne({
        email: email.toLowerCase(),
        purpose,
        createdAt: { $gt: new Date(Date.now() - 1 * 60 * 1000) }, // 1 minute ago
      });

      if (recentOTP) {
        throw new AppError("Please wait before requesting a new OTP", 429);
      }

      // Generate and send new OTP
      await this.generateAndSendOTP(email, purpose, req);

      return {
        success: true,
        message: "OTP resent successfully",
        resend: true,
      };
    } catch (error) {
      console.error("Error in resendOTP:", error);
      throw error;
    }
  }

  // Verify OTP for email verification (specific use case)
  static async verifyEmailWithOTP(email, otp) {
    try {
      // Verify OTP
      const result = await this.verifyOTP(email, otp, "email_verification");

      // Mark user as verified
      result.user.verified = true;
      await result.user.save();

      // Cleanup all OTPs for this email
      await OTP.deleteMany({
        email: email.toLowerCase(),
        purpose: "email_verification",
      });

      return {
        success: true,
        message: "Email verified successfully",
        user: result.user,
      };
    } catch (error) {
      console.error("Error in verifyEmailWithOTP:", error);
      throw error;
    }
  }

  // Check if OTP exists and is valid
  static async checkOTPStatus(email, purpose = "email_verification") {
    try {
      const otpDoc = await OTP.findOne({
        email: email.toLowerCase(),
        purpose,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      return {
        hasActiveOTP: !!otpDoc,
        expiresAt: otpDoc?.expiresAt,
        createdAt: otpDoc?.createdAt,
      };
    } catch (error) {
      console.error("Error in checkOTPStatus:", error);
      throw error;
    }
  }

  // Cleanup expired OTPs
  static async cleanupExpiredOTPs() {
    try {
      const result = await OTP.cleanup();
      return {
        success: true,
        deletedCount: result.deletedCount,
      };
    } catch (error) {
      console.error("Error in cleanupExpiredOTPs:", error);
      throw error;
    }
  }
}

module.exports = OTPService;
