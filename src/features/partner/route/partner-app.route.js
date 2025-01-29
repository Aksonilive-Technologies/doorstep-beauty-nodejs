// partnerRoute.js
const express = require("express");
const router = express.Router();
const {
  partnerById,
  checkExistance,
  updatePartner,
  addMoneyToWallet,
  getWalletBalance,
  updateTransactionStatus,
  fetchWalletTransactions,
} = require("../controller/partner-app.controller.js");
const { uploadSingleImage } = require("../../../../middleware/uploadMiddleware.js");
const verifyToken = require("../../../../middleware/verifyToken.js");

router.get("/profile/fetch", partnerById);
router.get("/check-existence", checkExistance);
router.post("/profile/update", uploadSingleImage, updatePartner);

router.post("/wallet/recharge", addMoneyToWallet);
// router.post("/debit", debitMoneyFromWallet);
router.post("/wallet/fetch", getWalletBalance);
router.post("/wallet/update-transaction-status", updateTransactionStatus);
router.post("/wallet/fetch-transactions", fetchWalletTransactions);

module.exports = router;
