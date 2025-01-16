// customersRoute.js
const express = require("express");
const {
  buyMembershipPlan,
  getAllMembership,
  updateMembershipTransactionStatus,
  getActivePlan
} = require("../controller/membershipCustomerController.js");

const router = express.Router();

router.post("/buy", buyMembershipPlan);
// router.put("/update", updateMembership);
// router.get("/fetch/all", getPlansByCustomerId);
router.post("/fetch/all", getAllMembership);
router.post(
  "/update-transaction-status",
  updateMembershipTransactionStatus
);
router.get("/fetch/active-plan", getActivePlan);

module.exports = router;
