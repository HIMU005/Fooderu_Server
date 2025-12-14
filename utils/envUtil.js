const getFrontendUrl = () => {
  if (process.env.NODE_ENV === "production") {
    return process.env.FRONTEND_URL_PRODUCTION;
  }
  // For development, testing, or any other environment
  return process.env.FRONTEND_URL_LOCAL || "http://localhost:5173";
};

module.exports = {
  getFrontendUrl,
};
