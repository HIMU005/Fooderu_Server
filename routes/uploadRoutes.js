const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }
    res.json({
      success: true,
      url: `http://localhost:5000/images/${req.file.filename}`,
    });
  } catch (err) {
    // console.error("Upload error:", err); // 👈 log backend error
    res
      .status(500)
      .json({ success: false, message: "Upload failed", error: err.message });
  }
});

module.exports = router;
