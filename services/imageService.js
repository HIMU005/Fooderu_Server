const imagekit = require("../config/imagekit");

/**
 * Upload multiple files to ImageKit
 * @param {Array} files - Array of file objects from multer
 * @returns {Promise<Object>} Upload results with successful and failed uploads
 */
const uploadMultipleToImageKit = async (files) => {
  const uploadPromises = files.map(async (file) => {
    const fileBase64 = file.buffer.toString("base64");
    const fileName = `${Date.now()}-${file.originalname}`;

    try {
      const result = await imagekit.upload({
        file: fileBase64,
        fileName: fileName,
        folder: "/my-app-uploads",
        useUniqueFileName: true,
      });

      return {
        success: true,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        fileId: result.fileId,
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      return {
        success: false,
        name: file.originalname,
        error: error.message,
      };
    }
  });

  const uploadResults = await Promise.all(uploadPromises);

  const successfulUploads = uploadResults.filter((result) => result.success);
  const failedUploads = uploadResults.filter((result) => !result.success);

  return {
    successfulUploads,
    failedUploads,
    totalCount: files.length,
    successCount: successfulUploads.length,
    failedCount: failedUploads.length,
  };
};

/**
 * Format upload response
 * @param {Object} uploadResults - Results from uploadMultipleToImageKit
 * @returns {Object} Formatted response
 */
const formatUploadResponse = (uploadResults) => {
  const { successfulUploads, failedUploads, totalCount, successCount } =
    uploadResults;

  const response = {
    success: successCount > 0,
    message: `Uploaded ${successCount} of ${totalCount} images`,
    data: {
      images: successfulUploads.map((img) => ({
        url: img.url,
        thumbnailUrl: img.thumbnailUrl,
        fileId: img.fileId,
        name: img.name,
        size: img.size,
        mimeType: img.mimeType,
      })),
    },
  };

  if (failedUploads.length > 0) {
    response.errors = failedUploads.map((f) => ({
      name: f.name,
      error: f.error,
    }));
  }

  return response;
};

module.exports = {
  uploadMultipleToImageKit,
  formatUploadResponse,
};
