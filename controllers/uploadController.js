const imagekit = require("../config/imagekit");

const uploadImage = async (req, res) => {
  try {
    // console.log("DEBUG: Controller started.");

    // 1. Validate File Existence
    if (!req.file) {
      console.error("DEBUG ERROR: No file received by Multer.");
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

module.exports = { uploadImage };
