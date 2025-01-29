const express = require("express");
const router = express.Router();
const { uploadSingleImage } = require("../middleware/uploadMiddleware");
const {
  uploadProfileImage,
} = require("./spareFileUploadController");

router.post("/profile-image/upload", uploadSingleImage, uploadProfileImage);

module.exports = router;
