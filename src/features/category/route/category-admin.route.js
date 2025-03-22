import express from "express";
const router = express.Router();
import * as categoryAdminController from "../controller/category-admin.controller.js";
import { uploadSingleImage } from "../../../../middleware/uploadMiddleware.js";
// Create a new category
router.post(
  "/create",
  uploadSingleImage,
  categoryAdminController.createCategory
);

// Get all categories
router.get("/fetch/all", categoryAdminController.getAllCategories);

// Update a category by ID
router.put(
  "/update/single",
  uploadSingleImage,
  categoryAdminController.updateCategory
);

// Soft delete a category by ID
router.delete("/delete/single", categoryAdminController.deleteCategory);

router.get("/change-status", categoryAdminController.changeStatus);

router.get("/download-excel", categoryAdminController.downloadExcelSheet);

export default router;
