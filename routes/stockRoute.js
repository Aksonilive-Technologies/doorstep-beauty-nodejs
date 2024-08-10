const express = require("express");
const router = express.Router();
const {
  createStock,
  fetchAllStocks,
  deleteStock,
  changeStatus,
} = require("../controller/stockController");

// Route for creating stock
router.post("/create", createStock);
router.get("/all", fetchAllStocks);
router.delete("/delete", deleteStock);
router.put("/change-status", changeStatus);

module.exports = router;
