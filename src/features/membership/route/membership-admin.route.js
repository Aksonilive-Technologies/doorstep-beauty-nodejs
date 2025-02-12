// customersRoute.js
import express from "express";
import {
  createMembership,
  updateMembership,
  changeMembershipStatus,
  fetchAllMemberships,
  deleteMembership,
  searchMembership,
} from "../controller/membership-admin.controller.js";

const router = express.Router();

router.post("/create", createMembership);
router.put("/update", updateMembership);
router.get("/fetch/all", fetchAllMemberships);
router.put("/change-status", changeMembershipStatus);
router.put("/delete", deleteMembership);
router.get("/search-membership", searchMembership);

export default router;
