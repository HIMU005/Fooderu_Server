const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./db");
const router = require("./routes");
const PORT = process.env.PORT || 5000;

const app = express();
app.use(express.json());
app.use(cors());
app.use(router);

app.get("/", (_req, res) => {
  res.json({ message: "Home Route" });
});

app.use((err, _req, res, _next) => {
  const message = err.message ? err.message : "Server error Occured";
  const status = err.status ? err.status : 500;

  res.status(status).json({ message });
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
