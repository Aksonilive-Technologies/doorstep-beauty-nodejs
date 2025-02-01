const cloudinary = require("cloudinary").v2;
const fs = require("fs/promises");
const dotenv = require("dotenv");

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      throw new Error("Local file path is required");
    }
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image",
    });
    // console.log("File uploaded to Cloudinary", response.url);
    return response.url;
  } catch (error) {
    console.error("Error uploading file to Cloudinary", error);
    // Attempt to delete the local file if upload failed
    try {
      await fs.unlink(localFilePath);
      // console.log("Local file deleted after failed upload", {
        // path: localFilePath,
      // });
    } catch (unlinkError) {
      console.error("Error deleting local file", {
        error: unlinkError.message,
      });
    }
    return null;
  }
};

module.exports = { uploadOnCloudinary };
