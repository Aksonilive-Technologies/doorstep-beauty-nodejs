const express = require("express");
const router = express.Router();

const {
  sendOTP,
  verifyOTP,
  registerMasterOTP,
  handleOrderCreatedWebhook,
} = require("../controller/authController");


router.get("/send", sendOTP);
router.post("/send-test", handleOrderCreatedWebhook);
router.post("/verify", verifyOTP);
router.post("/register-master-otp", registerMasterOTP);

module.exports = router;
