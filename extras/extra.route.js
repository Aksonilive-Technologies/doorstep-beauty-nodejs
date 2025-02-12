import express from "express";
const router = express.Router();
import { uploadSingleImage } from "../middleware/uploadMiddleware.js";
import {
  uploadProfileImage,
} from "./spareFileUploadController.js";

router.post("/profile-image/upload", uploadSingleImage, uploadProfileImage);

export default router;
