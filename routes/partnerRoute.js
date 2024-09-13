// partnerRoute.js
const express = require("express");
const router = express.Router();
const {
  partnerById,
  checkExistance,
  updatePartner,
} = require("../controller/partnerController.js");
const { uploadSingleImage } = require("../middleware/uploadMiddleware");
const verifyToken = require("../middleware/verifyToken.js");

router.get("/profile/fetch", partnerById);
router.get("/check-existence", checkExistance);
router.post("/profile/update", uploadSingleImage, updatePartner);

module.exports = router;

