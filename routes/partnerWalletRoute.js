// partnerRoute.js
const express = require("express");
const router = express.Router();
const {
  addMoneyToWallet,
  debitMoneyFromWallet,
  getWalletBalance,
  updateTransactionStatus,
  fetchWalletTransactions,
} = require("../controller/partnerWalletController.js");
const verifyToken = require("../middleware/verifyToken.js");

// router.post("/add", addMoneyToWallet);
// router.post("/debit", debitMoneyFromWallet);
router.post("/fetch", getWalletBalance);
// router.post("/update-transaction-status", updateTransactionStatus);
// router.post("/fetch-transactions", fetchWalletTransactions);


module.exports = router;
