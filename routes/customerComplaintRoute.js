// customersRoute.js
const express = require("express");
const {
  createComplaint,
} = require("../controller/customerComplainController.js");
const router = express.Router();

router.post("/create", createComplaint);
module.exports = router;
