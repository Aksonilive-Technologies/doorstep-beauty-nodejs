// customersRoute.js
const express = require("express");
const {
  createComplaint,
  getAllComplaints,
  resolvedComplaint,
} = require("../controller/customerComplainController.js");
const router = express.Router();

router.post("/create", createComplaint);
router.get("/all", getAllComplaints);
router.put("/resolved", resolvedComplaint);
module.exports = router;
