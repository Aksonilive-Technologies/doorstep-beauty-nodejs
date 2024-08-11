const express = require("express");
const router = express.Router();
const categoryController = require("../controller/categoryController");
const { uploadSingleImage } = require("../middleware/uploadMiddleware");

// Create a new category
router.post("/create", uploadSingleImage, categoryController.createCategory);

// Get all categories
router.get("/fetch/all", categoryController.getAllCategories);

router.get("/category/fetch/all", categoryController.getAllCategoriesCustomer);

// Get a single category by ID
router.get("/fetch/single", categoryController.getCategoryById);

// Update a category by ID
router.put("/update/single", categoryController.updateCategory);

// Soft delete a category by ID
router.delete("/delete/single", categoryController.deleteCategory);

router.get("/change-status", categoryController.changeStatus);

module.exports = router;
