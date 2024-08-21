// customersRoute.js
const express = require("express");
const {
  buyMembershipPlan,
  getPlansByCustomerId,
} = require("../controller/planAdminController.js");

const router = express.Router();

router.post("/buy", buyMembershipPlan);
// router.put("/update", updateMembership);
router.get("/fetch/all", getPlansByCustomerId);

module.exports = router;
