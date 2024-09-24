const express = require("express");
const router = express.Router();
const Bookings = require("../controller/partnerStockBookingController.js");

router.post("/create", Bookings.createStockBooking);
router.get("/fetch/all", Bookings.fetchAllStockBookings);

module.exports = router;
