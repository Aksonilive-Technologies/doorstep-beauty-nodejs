import express from "express";
const router = express.Router();
import * as Product from "../controller/product-admin.controller.js";
import { uploadSingleImage } from "../../../../middleware/uploadMiddleware.js";
import "../cronJob.js";
// Update the path accordingly

// Route to create a new product with image upload
// router.post("/create", upload.single("file"), Product.createProduct);
router.post("/create", uploadSingleImage, Product.createProduct);

// Other routes remain unchanged
// router.put("/update", uploadMultipleImages, Product.updateProduct);
router.put("/update", uploadSingleImage, Product.updateProduct);

// router.get("/fetch/single", Product.getProductById);
router.delete("/delete", Product.deleteProduct);
router.get("/fetch/all", Product.getAllProducts);
router.put("/change-status", Product.changeStatusById);
router.get("/download-excel", Product.downloadExcelSheet);
// router.get("/fetch/new-products", Product.getAllNewProducts);

export default router;
