const crypto = require("crypto");
const bcrypt = require("bcryptjs");

module.exports = function (userSchema) {
  // check password
  userSchema.methods.correctPassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  // Check if password changed after token was issued
  userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
        this.passwordChangedAt.getTime() / 1000,
        10
      );

      return JWTTimestamp < changedTimestamp;
    }

    return false;
  };

  // Generate password reset token
  userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");

    this.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 miniutes

    return resetToken;
  };
};
