const bcrypt = require("bcryptjs");

module.exports = function (userSchema) {
  // password hashing
  userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
  });

  // Track password change time
  userSchema.pre("save", function (next) {
    if (!this.isModified("password") || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
  });

  //   // Filter out inactive users by default
  //   userSchema.pre(/^find/, function (next) {
  //     this.find({ active: { $ne: false } });
  //     next();
  //   });
};
