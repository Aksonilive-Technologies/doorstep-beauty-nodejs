import express from "express";
const router = express.Router();
import { uploadSingleImage } from "../middleware/uploadMiddleware.js";
import {
  uploadSpareImage,
} from "./spareFileUploadController.js";

router.post("/spare-image/upload", uploadSingleImage, uploadSpareImage);

export default router;
