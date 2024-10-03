const express = require("express");
const router = express.Router();
const {
  createStock,
  fetchAllStocks,
  deleteStock,
  changeStatus
} = require("../controller/stockController");
const { uploadSingleImage } = require("../middleware/uploadMiddleware");
// Route for creating stock
router.post("/create", uploadSingleImage, createStock);
router.get("/all", fetchAllStocks);
router.delete("/delete", deleteStock);
router.put("/change-status", changeStatus);

module.exports = router;
