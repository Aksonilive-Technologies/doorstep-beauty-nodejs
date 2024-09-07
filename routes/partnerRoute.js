// partnerRoute.js
const express = require("express");
const router = express.Router();
const {
  partnerById,
  checkExistance,
  addMoneyToWallet,
  debitMoneyFromWallet,
  getWalletBalance,
  updateTransactionStatus,
  fetchWalletTransactions,
} = require("../controller/partnerController.js");
const verifyToken = require("../middleware/verifyToken.js");

router.get("/profile/fetch", partnerById);
router.get("/check-existence", checkExistance);
// router.post("/add", addMoneyToWallet);
// router.post("/debit", debitMoneyFromWallet);
// router.post("/fetch", getWalletBalance);
// router.post("/update-transaction-status", updateTransactionStatus);
// router.post("/fetch-transactions", fetchWalletTransactions);


module.exports = router;
