const express = require("express");
const router = express.Router();
const {
  sendOTP,
  verifyOTP,
  registerMasterOTP,
  getAllMasterOTP,
  updateMasterOTP,
  deleteMasterOTP,
} = require("../controller/authController");


router.get("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/register-master-otp", registerMasterOTP);
router.post("/update-master-otp", updateMasterOTP);
router.get("/get-all-master-otp", getAllMasterOTP);
router.delete("/delete-master-otp", deleteMasterOTP);



module.exports = router;
