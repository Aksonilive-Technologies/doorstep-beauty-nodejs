const express = require("express");
router = express.Router();



const {
  register,
  getPartners,
  updatePartner,
  deletePartner,
} = require("../controller/partnerController");
const verifyToken = require("../middleware/verifyToken");



router.post("/register", register);
router.get("/all", verifyToken, getPartners);
router.put("/update", verifyToken, updatePartner);
router.delete("/delete", verifyToken, deletePartner);

module.exports = router;
