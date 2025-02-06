const express = require("express");
const router = express.Router();
const Product = require("../controller/product-app.controller.js"); // Update the path accordingly

router.get("/fetch/new-products", Product.getAllNewProducts);
router.get("/fetch/all", Product.getAllProducts);

module.exports = router;
