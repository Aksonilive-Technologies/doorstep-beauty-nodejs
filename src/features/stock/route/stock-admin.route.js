const express = require("express");
const router = express.Router();
const {
  createStock,
  fetchAllStocks,
  deleteStock,
  changeStatus,
  updateStock,
  downloadExcelSheet,
  searchStock,
  fetahAllStockBooking,
} = require("../controller/stock-admin.controller");
const { uploadSingleImage, uploadMultipleImages } = require("../../../../middleware/uploadMiddleware");
// Route for creating stock
router.post("/create", uploadMultipleImages, createStock);
router.get("/all", fetchAllStocks);
router.put("/update", uploadMultipleImages, updateStock);
router.delete("/delete", deleteStock);
router.put("/change-status", changeStatus);
router.get("/download-excel", downloadExcelSheet);
router.get("/searchStock", searchStock);
router.get("/booking/fetch/all", fetahAllStockBooking);

module.exports = router;
