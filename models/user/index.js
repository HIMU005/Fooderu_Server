const mongoose = require("mongoose");
const schema = require("./user.schema");
const methods = require("./user.methods");
const middleware = require("./user.middleware");

methods(schema);
middleware(schema);

module.exports = mongoose.model("User", schema);
