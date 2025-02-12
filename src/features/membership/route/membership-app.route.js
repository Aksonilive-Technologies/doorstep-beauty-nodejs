// customersRoute.js
import express from "express";
import {
  buyMembershipPlan,
  getAllMembership,
  updateMembershipTransactionStatus,
  getActivePlan,
} from "../controller/membership-app.controller.js";

const router = express.Router();

router.post("/buy", buyMembershipPlan);
router.post("/fetch/all", getAllMembership);
router.post("/update-transaction-status", updateMembershipTransactionStatus);
router.get("/fetch/active-plan", getActivePlan);

export default router;
