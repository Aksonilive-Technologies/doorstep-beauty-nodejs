import express from "express";
const router = express.Router();

import {
  register,
  getPartners,
  updatePartner,
  deletePartner,
  changeStatus,
  downloadExcelSheet,
  searchPartners,
} from "../controller/partner-admin.controller.js";
import { uploadSingleImage } from "../../../../middleware/uploadMiddleware.js";

// need to approve
router.post("/register", uploadSingleImage, register);
router.get("/all", getPartners);
router.put("/update", uploadSingleImage, updatePartner);
router.delete("/delete", deletePartner);
router.put("/change-status", changeStatus);
router.get("/download-excel", downloadExcelSheet);
router.get("/search", searchPartners);

export default router;
