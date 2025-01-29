const express = require("express");
const router = express.Router();
const { uploadSingleImage } = require("../middleware/uploadMiddleware");
const {
  uploadProfileImage,
} = require("./spareFileUploadController");

router.post("/upload/profile-image", uploadSingleImage, uploadProfileImage);

module.exports = router;
