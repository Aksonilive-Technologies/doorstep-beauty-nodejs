// customersRoute.js
const express = require("express");
const router = express.Router();
const {
  register,
  updateCustomer,
  customerById,
  checkExistance,
  addMoneyToWallet,
  debitMoneyFromWallet,
  getWalletBalance,
  updateTransactionStatus,
  fetchWalletTransactions,
} = require("../controller/customer-app.controller.js");
const {
  uploadSingleImage,
} = require("../../../../middleware/uploadMiddleware.js");

router.post("/register", uploadSingleImage, register);
// router.patch("/update", uploadSingleImage, updateCustomer);
router.post("/update", uploadSingleImage, updateCustomer);
// router.post("/update", uploadSingleImage, updateCustomer);


router.get("/profile/fetch", customerById);
router.get("/check-existence", checkExistance);
router.post("/wallet/add", addMoneyToWallet);
router.post("/wallet/debit", debitMoneyFromWallet);
router.post("/wallet/fetch", getWalletBalance);
router.post("/wallet/update-transaction-status", updateTransactionStatus);
router.post("/wallet/fetch-transactions", fetchWalletTransactions);

module.exports = router;
