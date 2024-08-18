// customersRoute.js
const express = require("express");
const router = express.Router();
const {
  register,
  getAllCustomers,
  updateCustomer,
  deleteCustomer,
  changeStatusDeletedCustomer,
  customerById,
  checkExistance,
  addMoneyToWallet,
  debitMoneyFromWallet,
  getWalletBalance,
  updateTransactionStatus,
  fetchWalletRechargeTransactions
} = require("../controller/customerController.js");
const verifyToken = require("../middleware/verifyToken.js");
const { uploadSingleImage } = require("../middleware/uploadMiddleware");


router.post("/register", uploadSingleImage,register);
router.get("/all", getAllCustomers);
// router.patch("/update", uploadSingleImage, updateCustomer);
router.post("/update", uploadSingleImage, updateCustomer);
// router.post("/update", uploadSingleImage, updateCustomer);
router.delete("/delete", deleteCustomer);
router.put("/change-status", changeStatusDeletedCustomer);
router.get('/profile/fetch',customerById);
router.get('/check-existence',checkExistance)
router.post("/add", addMoneyToWallet);
router.post("/debit", debitMoneyFromWallet);
router.post("/fetch",getWalletBalance );
router.post('/update-transaction-status', updateTransactionStatus);
router.post('/fetch-transactions',fetchWalletRechargeTransactions);

module.exports = router;
