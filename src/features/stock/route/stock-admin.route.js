import express from "express";
const router = express.Router();
import {
  createStock,
  fetchAllStocks,
  deleteStock,
  changeStatus,
  updateStock,
  downloadExcelSheet,
  searchStock,
  fetahAllStockBooking,
} from "../controller/stock-admin.controller.js";
import {
  uploadSingleImage,
  uploadMultipleImages,
} from "../../../../middleware/uploadMiddleware.js";
// Route for creating stock
router.post("/create", uploadMultipleImages, createStock);
router.get("/all", fetchAllStocks);
router.put("/update", uploadMultipleImages, updateStock);
router.delete("/delete", deleteStock);
router.put("/change-status", changeStatus);
router.get("/download-excel", downloadExcelSheet);
router.get("/searchStock", searchStock);
router.get("/booking/fetch/all", fetahAllStockBooking);

export default router;
