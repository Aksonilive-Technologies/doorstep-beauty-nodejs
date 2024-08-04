const express = require("express");
router = express.Router();



const {
  register,
  getPartners,
  updatePartner,
  deletePartner,
} = require("../controller/partnerController");



router.post("/register", register);
router.get("/all", getPartners);
router.put("/update", updatePartner);
router.delete("/delete", deletePartner);

module.exports = router;
