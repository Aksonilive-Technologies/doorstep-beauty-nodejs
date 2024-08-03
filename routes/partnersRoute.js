const express = require("express");
const {
  Register,
  getPartners,
  updatePartner,
  deletePartner,
} = require("../controllers/partnersControllers");

router = express.Router();

router.post("/register", Register);
router.get("/all", getPartners);
router.put("/update", updatePartner);
router.delete("/delete", deletePartner);

module.exports = router;
