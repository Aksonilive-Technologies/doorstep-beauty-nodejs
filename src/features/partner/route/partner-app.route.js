// partnerRoute.js
import express from "express";
const router = express.Router();
import {
  partnerById,
  checkExistance,
  updatePartner,
  addMoneyToWallet,
  getWalletBalance,
  updateTransactionStatus,
  fetchWalletTransactions,
} from "../controller/partner-app.controller.js";
import { uploadSingleImage } from "../../../../middleware/uploadMiddleware.js";
import verifyToken from "../../../../middleware/verifyToken.js";

router.get("/profile/fetch", partnerById);
router.get("/check-existence", checkExistance);
router.post("/profile/update", uploadSingleImage, updatePartner);

router.post("/wallet/recharge", addMoneyToWallet);
// router.post("/debit", debitMoneyFromWallet);
router.post("/wallet/fetch", getWalletBalance);
router.post("/wallet/update-transaction-status", updateTransactionStatus);
router.post("/wallet/fetch-transactions", fetchWalletTransactions);

export default router;
