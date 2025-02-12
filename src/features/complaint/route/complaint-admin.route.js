// customersRoute.js
import express from "express";
import {
  getAllComplaints,
  resolvedComplaint,
  searchComplaints,
} from "../controller/complaint-admin.controller.js";
const router = express.Router();

// router.post("/create", createComplaint);
router.get("/all", getAllComplaints);
router.put("/resolved", resolvedComplaint);
router.get("/search-complaint", searchComplaints);
export default router;
