const express = require("express");
const router = express.Router();

const {
  sendOTP,
  verifyOTP,
  registerMasterOTP,
} = require("../controller/otp.controller");

router.get("/send", sendOTP);
router.post("/verify", verifyOTP);
router.post("/register-master-otp", registerMasterOTP);

module.exports = router;
