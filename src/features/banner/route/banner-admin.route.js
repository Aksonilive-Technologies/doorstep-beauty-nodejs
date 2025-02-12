import express from "express";
const router = express.Router();
import * as bannerController from "../controller/banner-admin.controller.js";
import { uploadSingleImage } from "../../../../middleware/uploadMiddleware.js";

// Route to create a new banner
router.post("/create", uploadSingleImage, bannerController.addBanner);
router.get("/all", bannerController.getBanner);
router.put("/update", uploadSingleImage, bannerController.updateBanner);
router.get("/change-status", bannerController.changeStatus);
router.delete("/delete", bannerController.deleteBanner);

export default router;
