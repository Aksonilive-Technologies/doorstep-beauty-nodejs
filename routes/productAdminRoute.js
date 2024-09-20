const express = require("express");
const router = express.Router();
const Product = require("../controller/productAdminController.js");
const { uploadMultipleImages, uploadSingleImage } = require("../middleware/uploadMiddleware");
 // Update the path accordingly

// Route to create a new product with image upload
// router.post("/create", upload.single("file"), Product.createProduct);
router.post("/create", uploadMultipleImages, Product.createProduct);

// Other routes remain unchanged
router.put("/update", uploadSingleImage, Product.updateProduct);
// router.get("/fetch/single", Product.getProductById);
router.delete("/delete", Product.deleteProduct);
router.get("/fetch/all", Product.getAllProducts);
router.put("/change-status", Product.changeStatusById);
// router.get("/fetch/new-products", Product.getAllNewProducts);

module.exports = router;
