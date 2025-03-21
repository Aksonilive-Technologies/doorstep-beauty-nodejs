import express from "express";
const router = express.Router();
import * as Bookings from "../controller/booking-admin.controller.js";

router.get("/fetch/all", Bookings.fetchBookings);
router.get("/download-excel", Bookings.downloadExcelSheet);
router.get("/search", Bookings.searchBookings);
router.post("/assign-partner", Bookings.assignPartnerToBooking);

export default router;
