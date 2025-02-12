import express from "express";
const router = express.Router();
import * as Order from "../controller/booking-customer.controller.js";

router.post("/create", Order.bookProduct);
// router.put("/update", Order.updateOrder);
router.get("/fetch/all", Order.fetchBookings);
// router.delete("/delete", Order.deleteOrder);
router.post("/cancel", Order.cancelBooking);
router.get("/fetch/recent", Order.fetchRecentBookedProducts);
router.post("/rate-partner", Order.ratePartner);
router.post("/rate-booking", Order.rateBooking);
router.post("/update-transaction", Order.updateTransaction);
router.post("/create-transaction", Order.initiatePayment);
router.get("/most-booked", Order.getMostBookedProducts);

export default router;
