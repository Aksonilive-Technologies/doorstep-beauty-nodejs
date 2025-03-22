// customersRoute.js
import express from "express";
import {
  createMembership,
  updateMembership,
  changeMembershipStatus,
  fetchAllMemberships,
  deleteMembership,
} from "../controller/membership-admin.controller.js";

const router = express.Router();

router.post("/create", createMembership);
router.put("/update", updateMembership);
router.get("/fetch/all", fetchAllMemberships);
router.put("/change-status", changeMembershipStatus);
router.put("/delete", deleteMembership);

export default router;
