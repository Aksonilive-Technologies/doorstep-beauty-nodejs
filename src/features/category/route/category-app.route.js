const express = require("express");
const router = express.Router();
const productAppController = require("../../product/controller/product-app.controller");

router.get("/fetch/all", productAppController.getAllCategoryProducts);

module.exports = router;
