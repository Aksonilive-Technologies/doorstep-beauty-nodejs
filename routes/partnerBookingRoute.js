const express = require("express");
router = express.Router();
const Bookings = require("../controller/partnerBookingController.js")


router.get("/fetch", Bookings.fetchBookings);
router.post("/fetch/unconfirmed", Bookings.fetchUnconfirmedBookings);
module.exports = router