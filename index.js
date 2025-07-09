const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./db");
const router = require("./routes");
const PORT = process.env.PORT || 5000;

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (_req, res) => {
  res.json({ message: "Home Route" });
});

app.use(router);

// app.listen(PORT, () => {
//   console.log(`Example app listening on port ${PORT}`);
// });

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
