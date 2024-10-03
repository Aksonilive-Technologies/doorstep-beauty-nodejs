const express = require("express");
const router = express.Router();
const categoryAdminController = require("../controller/categoryAdminController");
const { uploadSingleImage } = require("../middleware/uploadMiddleware");
// Create a new category
router.post("/create", uploadSingleImage, categoryAdminController.createCategory);

// Get all categories
router.get("/fetch/all", categoryAdminController.getAllCategories);

// Update a category by ID
router.put("/update/single", uploadSingleImage, categoryAdminController.updateCategory);

// Soft delete a category by ID
router.delete("/delete/single", categoryAdminController.deleteCategory);

router.get("/change-status", categoryAdminController.changeStatus);

router.get("/download-excel", categoryAdminController.downloadExcelSheet)

module.exports = router;
