const express = require("express");
const router = express.Router();
const {
  fetchAssignedStocks,
  fetchAllStocks,
} = require("../controller/partnerStockController");
const { uploadSingleImage } = require("../middleware/uploadMiddleware");
// Route for creating stock
router.post("/assigned", fetchAssignedStocks);
router.get("/fetch/all", fetchAllStocks);

module.exports = router;
