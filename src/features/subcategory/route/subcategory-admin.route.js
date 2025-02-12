import express from "express";
const router = express.Router();
import * as subcategoryAdminController from "../controller/subcategory-admin.controller.js";
import { uploadSingleImage } from "../../../../middleware/uploadMiddleware.js";
// Create a new Subcategory
router.post(
  "/create",
  uploadSingleImage,
  subcategoryAdminController.createSubcategory
);

// Get all Subcategories
router.get("/fetch/all", subcategoryAdminController.getAllSubcategories);

// Get subcategories by category
router.get(
  "/fetch/by-category",
  subcategoryAdminController.getSubcategoryByCategory
);

// Update a Subcategory by ID
router.put(
  "/update/single",
  uploadSingleImage,
  subcategoryAdminController.updateSubcategory
);

// Soft delete a Subcategory by ID
router.delete("/delete/single", subcategoryAdminController.deleteSubcategory);

router.get("/change-status", subcategoryAdminController.changeStatus);

router.get("/download-excel", subcategoryAdminController.downloadExcelSheet);

router.get("/search-category", subcategoryAdminController.searchSubcategory);

export default router;
