// customersRoute.js
const express = require("express");
const {
  buyMembershipPlan,
  getPlansByCustomerId,
} = require("../controller/planAdminController.js");
const {
  getAllMembership,
  updateMembershipTransactionStatus,
} = require("../controller/membershipCustomerController.js");

const router = express.Router();

router.post("/buy", buyMembershipPlan);
// router.put("/update", updateMembership);
// router.get("/fetch/all", getPlansByCustomerId);
router.get("/fetch/all", getAllMembership);
router.post(
  "/update-transaction-status",
  updateMembershipTransactionStatus
);

module.exports = router;
