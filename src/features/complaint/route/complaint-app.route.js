// customersRoute.js
import express from "express";
import {
  createComplaint,
  getAllComplaintWithCustomerId,
} from "../controller/complaint-app.controller.js";
const router = express.Router();

router.post("/create", createComplaint);
router.get("/fetch/complain", getAllComplaintWithCustomerId);
export default router;
