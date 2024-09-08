const express = require("express");
const router = express.Router();
const Bookings = require("../controller/partnerBookingController.js");


router.post("/fetch/unconfirmed", Bookings.fetchUnconfirmedBookings);
router.post("/accept", Bookings.acceptBooking);
router.post("/fetch/all", Bookings.fetchAllBookings);
router.post("/complete", Bookings.completeBooking);
// router.post("/cancel", Bookings.cancelBooking);
router.post("/start", Bookings.startBooking);
module.exports = router