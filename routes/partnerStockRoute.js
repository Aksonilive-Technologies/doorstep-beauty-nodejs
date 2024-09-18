const express = require("express");
const router = express.Router();
const {
  fetchAssignedStocks,
} = require("../controller/partnerStockController");
const { uploadSingleImage } = require("../middleware/uploadMiddleware");
// Route for creating stock
router.post("/assigned", fetchAssignedStocks);

module.exports = router;
