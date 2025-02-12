import express from "express";
const router = express.Router();
import {
  getProductByBarcode,
  fetchAllStocks,
} from "../controller/stock-partner.controller.js";
import { uploadSingleImage } from "../../../../middleware/uploadMiddleware.js";
// Route for creating stock
router.get("/fetch/product-by-barcode", getProductByBarcode);
router.get("/fetch/all", fetchAllStocks);

export default router;
