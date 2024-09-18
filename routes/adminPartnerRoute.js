const express = require("express");
router = express.Router();

const {
  register,
  getPartners,
  updatePartner,
  deletePartner,
  changeStatus,
} = require("../controller/adminPartnerController.js");
const verifyToken = require("../middleware/verifyToken");
const { uploadSingleImage } = require("../middleware/uploadMiddleware");

// need to approve
router.post("/register", uploadSingleImage, register);
router.get("/all", getPartners);
router.put("/update", uploadSingleImage, updatePartner);
router.delete("/delete", deletePartner);
router.put("/change-status", changeStatus);

module.exports = router;
