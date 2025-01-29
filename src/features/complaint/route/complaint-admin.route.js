// customersRoute.js
const express = require("express");
const {
  getAllComplaints,
  resolvedComplaint,
  searchComplaints,
} = require("../controller/complaint-admin.controller.js");
const router = express.Router();

// router.post("/create", createComplaint);
router.get("/all", getAllComplaints);
router.put("/resolved", resolvedComplaint);
router.get("/search-complaint", searchComplaints);
module.exports = router;
