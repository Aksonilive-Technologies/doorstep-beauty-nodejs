const express = require("express");
router = express.Router();

const {
  register,
  getPartners,
  updatePartner,
  deletePartner,
  changeStatus,
} = require("../controller/partnerController");
const verifyToken = require("../middleware/verifyToken");

router.post("/register", register);
router.get("/all", getPartners);
router.put("/update", updatePartner);
router.delete("/delete", deletePartner);
router.put("/change-status", changeStatus);

module.exports = router;
