import express from "express";
const router = express.Router();
import * as Bookings from "../../booking/controller/booking-partner.controller.js";

router.post("/fetch/unconfirmed", Bookings.fetchUnconfirmedBookings);
router.post("/accept", Bookings.acceptBooking);
router.post("/fetch/all", Bookings.fetchAllBookings);
router.post("/complete", Bookings.completeBooking);
router.post("/cancel", Bookings.cancelBooking);
router.post("/start", Bookings.startBooking);
export default router;
