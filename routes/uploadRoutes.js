const express = require("express");
const multer = require("multer");
const { uploadImage } = require("../controllers/uploadController");

const router = express.Router();

// 1. Setup Multer to store file in RAM (MemoryStorage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route for multiple image uploads
// router.post("/multiple", upload.array("images", 10), uploadMultipleImages);

// 2. Define Route with Debugging
router.post(
  "/",
  // Middleware 1: Logging
  (req, res, next) => {
    // console.log("DEBUG: Request received at /api/upload");
    next();
  },
  // Middleware 2: Multer (Processes the file)
  upload.single("image"),
  // Middleware 3: Controller
  uploadImage,
);

module.exports = router;
