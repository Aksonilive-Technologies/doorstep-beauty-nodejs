// customersRoute.js
const express = require("express");
const {
  createComplaint,
  getAllComplaintWithCustomerId,
} = require("../controller/complaint-app.controller.js");
const router = express.Router();

router.post("/create", createComplaint);
router.get("/fetch/complain", getAllComplaintWithCustomerId);
module.exports = router;
