const express = require("express");
const router = express.Router();
const Bookings = require("../controller/stock-booking.controller");

router.post("/create", Bookings.createStockBooking);
router.get("/fetch/all", Bookings.fetchAllStockBookings);
router.post("/cancel", Bookings.cancelBooking);

module.exports = router;
