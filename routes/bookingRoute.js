const express = require("express");
router = express.Router();
const Order = require("../controller/bookingController")



router.post("/create", Order.bookProduct);
// router.put("/update", Order.updateOrder);
router.get("/fetch/all", Order.fetchBookings);
// router.delete("/delete", Order.deleteOrder);
router.post("/cancel", Order.cancelBooking);
router.get("/fetch/recent", Order.fetchRecentBookedProducts);
router.post('/rate-partner', Order.ratePartner);
router.post('/rate-booking', Order.rateBooking);
router.post('/update-transaction', Order.updateTransaction);
module.exports = router