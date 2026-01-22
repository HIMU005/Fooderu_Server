const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./db");
const router = require("./routes");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json");
const PORT = process.env.PORT || 5000;
const YAML = require("yamljs");
const fs = require("fs");

const app = express();
app.use(express.json());
const corsOptions = {
  origin: [process.env.FRONTEND_URL],
  // credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(router);
app.use("/images", express.static(path.join(__dirname, "images")));

// event status auto update
require("./cronJobs/updateEventStatus");

app.get("/", (_req, res) => {
  res.json({ message: "Home Route" });
});

app.use((err, _req, res, _next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    status: err.status,
    statusCode: err.statusCode,
    message: err.message,
  });
});

connectDB(process.env.DB_URL)
  .then(() => {
    console.log("Database Connected!");

    app.listen(PORT, () => {
      console.log(` server is listening on port ${PORT}`);
    });
  })
  .catch((e) => {
    console.log(e);
  });
