const express = require("express");
const router = express.Router();
const subcategoryAdminController = require("../controller/subcategory.admin.controller");
const {
  uploadSingleImage,
} = require("../../../../middleware/uploadMiddleware");
// Create a new Subcategory
router.post(
  "/create",
  uploadSingleImage,
  subcategoryAdminController.createSubcategory
);

// Get all Subcategories
router.get("/fetch/all", subcategoryAdminController.getAllSubcategories);

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

module.exports = router;
