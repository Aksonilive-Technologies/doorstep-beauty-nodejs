// customersRoute.js
const express = require("express");
const {
  createMembership,
  updateMembership,
  changeMembershipStatus,
  fetchAllMemberships,
  deleteMembership,
} = require("../controller/membershipController.js");

const router = express.Router();

router.post("/create", createMembership);
router.put("/update", updateMembership);
router.get("/fetch/all", fetchAllMemberships);
router.put("/change-status", changeMembershipStatus);
router.put("/delete", deleteMembership);

module.exports = router;
