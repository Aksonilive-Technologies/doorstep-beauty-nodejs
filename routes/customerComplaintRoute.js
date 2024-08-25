// customersRoute.js
const express = require("express");
const {
  createComplaint,
  getAllComplaintWithCustomerId,
} = require("../controller/customerComplainController.js");
const router = express.Router();

router.post("/create", createComplaint);
router.get("/fetch/complain", getAllComplaintWithCustomerId);
module.exports = router;
