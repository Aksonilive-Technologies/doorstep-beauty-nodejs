const express = require("express");
router = express.Router();
const Bookings = require("../controller/bookingAdminController")


router.get("/fetch/all", Bookings.fetchBookings);
module.exports = router