import express from "express";
const router = express.Router();

import {
  sendOTP,
  verifyOTP,
  registerMasterOTP,
} from "../controller/otp.controller.js";

router.get("/send", sendOTP);
router.post("/verify", verifyOTP);
router.post("/register-master-otp", registerMasterOTP);

export default router;
