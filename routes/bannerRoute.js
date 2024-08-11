const express = require("express");
const router = express.Router();
const bannerController = require("../controller/bannerController");
const { uploadSingleImage } = require("../middleware/uploadMiddleware");

// Route to create a new banner
router.post("/create", uploadSingleImage, bannerController.addBanner);
router.get("/all", bannerController.getBanner);
router.put("/update", bannerController.updateBanner);
router.get("/change-status", bannerController.changeStatus);
router.delete("/delete", bannerController.deleteBanner);

module.exports = router;
