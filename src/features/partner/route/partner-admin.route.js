const express = require("express");
router = express.Router();

const {
  register,
  getPartners,
  updatePartner,
  deletePartner,
  changeStatus,
  downloadExcelSheet,
  searchPartners,
} = require("../controller/partner-admin.controller.js");
const verifyToken = require("../../../../middleware/verifyToken.js");
const {
  uploadSingleImage,
} = require("../../../../middleware/uploadMiddleware.js");

// need to approve
router.post("/register", uploadSingleImage, register);
router.get("/all", getPartners);
router.put("/update", uploadSingleImage, updatePartner);
router.delete("/delete", deletePartner);
router.put("/change-status", changeStatus);
router.get("/download-excel", downloadExcelSheet);
router.get("/searchPartner", searchPartners);

module.exports = router;
