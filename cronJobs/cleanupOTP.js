const cron = require("node-cron");
const OTPService = require("../services/otpService");

// Run every hour to cleanup expired OTPs
const cleanupOTPJob = cron.schedule("0 * * * *", async () => {
  try {
    console.log("Running OTP cleanup job...");

    const result = await OTPService.cleanupExpiredOTPs();
    console.log(
      `OTP cleanup completed. Deleted ${result.deletedCount || 0} OTPs.`,
    );
  } catch (error) {
    console.error("Error during OTP cleanup job:", error);
  }
});

module.exports = cleanupOTPJob;
