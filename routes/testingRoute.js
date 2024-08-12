const express = require("express");
const router = express.Router();
const { uploadSingleImage } = require("../middleware/uploadMiddleware");
const { testImages } = require("../controller/testingController");


router.post("/create", uploadSingleImage, testImages);

module.exports = router;
