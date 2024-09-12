const express = require("express");
const router = express.Router();
const {
  fetchAllStockAssignments,
  assignStocks,
} = require("../controller/stockAssignmentController.js");

// create new stock assignment to the partner
router.post("/create", assignStocks);

// get all the assigned stocks to the partner
router.get("/all", fetchAllStockAssignments);

module.exports = router;
