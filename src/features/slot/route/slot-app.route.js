const express = require("express");
const router = express.Router();
const slotController = require("../controller/slot-app.controller");

// Create a new slot

router.get("/fetch/all", slotController.getSlotsCustomer);

module.exports = router;
