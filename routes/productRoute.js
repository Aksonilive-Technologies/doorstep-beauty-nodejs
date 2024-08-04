const express = require("express");
router = express.Router();
const Product = require("../controller/productController");



router.post("/create", Product.createProduct);
router.put("/update", Product.updateProduct);
router.get("/fetch/single", Product.getProductById);
router.delete("/delete", Product.deleteProduct);
router.get("/fetch/all", Product.getAllProducts);
router.get("/fetch/new-products", Product.getAllNewProducts);




module.exports = router