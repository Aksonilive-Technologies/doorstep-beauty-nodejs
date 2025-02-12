import express from "express";
const router = express.Router();
import * as Bookings from "../controller/stock-booking.controller.js";

router.post("/create", Bookings.createStockBooking);
router.get("/fetch/all", Bookings.fetchAllStockBookings);
router.post("/cancel", Bookings.cancelBooking);

export default router;
