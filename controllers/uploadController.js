const imagekit = require("../config/imagekit");
const AppError = require("../utils/AppError");
const {
  uploadMultipleToImageKit,
  formatUploadResponse,
} = require("../services/imageService");

const uploadImage = async (req, res) => {
  try {
    // console.log("DEBUG: Controller started.");

    // 1. Validate File Existence
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // console.log(`DEBUG: File received. Name: ${req.file.originalname}, Size: ${req.file.size} bytes`);

    // 2. Prepare for ImageKit
    const fileBase64 = req.file.buffer.toString("base64");
    const fileName = `${Date.now()}-${req.file.originalname}`; // Unique name

    // console.log("DEBUG: Uploading to ImageKit...");

    // 3. Upload
    const result = await imagekit.upload({
      file: fileBase64,
      fileName: fileName,
      folder: "/my-app-uploads", // Optional: organize your files
      // 'useUniqueFileName' is true by default, prevents overwriting
    });

    // 4. Log Success
    // console.log("DEBUG: ImageKit Upload Success!");
    // console.log("DEBUG: URL ->", result.url);
    // console.log("DEBUG: FileID ->", result.fileId);

    // 5. Send Response
    res.status(200).json({
      success: true,
      message: "Uploaded successfully",
      url: result.url,
      thumbnailUrl: result.thumbnailUrl, // ImageKit generates this automatically
      details: result, // sending full details for debugging on frontend
    });
  } catch (error) {
    // console.error("DEBUG ERROR: Upload Failed", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

/**
 * Upload multiple images to ImageKit
 * Handles both single file (req.file) and multiple files (req.files)
 */

// This function is currently not used in routes, but can be enabled for multiple uploads in the future
/*
const uploadMultipleImages = async (req, res, next) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);

    if (!files || files.length === 0) {
      throw new AppError("No files uploaded", 400);
    }

    const uploadResults = await uploadMultipleToImageKit(files);

    const response = formatUploadResponse(uploadResults);
    const statusCode = uploadResults.failedCount === files.length ? 500 : 200;

    return res.status(statusCode).json(response);
  } catch (error) {
    next(error);
  }
};
*/

module.exports = { uploadImage, uploadMultipleImages };
