const express = require("express");
router = express.Router();
const Bookings = require("../controller/bookingAdminController");

router.get("/fetch/all", Bookings.fetchBookings);
router.get("/download-excel", Bookings.downloadExcelSheet);
router.get("/search-booking", Bookings.searchBookings);

module.exports = router;
