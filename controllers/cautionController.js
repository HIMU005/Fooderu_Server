const Caution = require("../models/Caution");

const getAllCaution = async (req, res, next) => {
  try {
    const cautions = await Caution.find().select("name");
    return res.json({
      status: "success",
      data: cautions,
      message: "all caution fetched",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllCaution };
