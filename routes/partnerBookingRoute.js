const express = require("express");
const router = express.Router();
const Bookings = require("../controller/partnerBookingController.js");


router.post("/fetch/unconfirmed", Bookings.fetchUnconfirmedBookings);
router.post("/accept", Bookings.acceptBooking);
module.exports = router