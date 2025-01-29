const express = require("express");
const router = express.Router();
const {
  getProductByBarcode,
  fetchAllStocks,
} = require("../controller/stock-partner.controller");
const { uploadSingleImage } = require("../../../../middleware/uploadMiddleware");
// Route for creating stock
router.get("/fetch/product-by-barcode", getProductByBarcode);
router.get("/fetch/all", fetchAllStocks);

module.exports = router;
