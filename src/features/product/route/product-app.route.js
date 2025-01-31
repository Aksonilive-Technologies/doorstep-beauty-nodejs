const express = require("express");
const router = express.Router();
const Product = require("../controller/product-app.controller.js");
const upload = require("../../../../middleware/multerMiddleware.js"); // Update the path accordingly

router.get("/fetch/single", Product.getProductById);
router.get("/fetch/all", Product.getAllProducts);
router.get("/fetch/new-products", Product.getAllNewProducts);

module.exports = router;
