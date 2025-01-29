const express = require("express");
const router = express.Router();
const bannerController = require("../controller/banner-admin.controller");
const {
  uploadSingleImage,
} = require("../../../../middleware/uploadMiddleware");

// Route to create a new banner
router.post("/create", uploadSingleImage, bannerController.addBanner);
router.get("/all", bannerController.getBanner);
router.put("/update", uploadSingleImage, bannerController.updateBanner);
router.get("/change-status", bannerController.changeStatus);
router.delete("/delete", bannerController.deleteBanner);

module.exports = router;
