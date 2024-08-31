const express = require("express");
router = express.Router();
const Order = require("../controller/bookingController")



router.post("/create", Order.bookProduct);
// router.put("/update", Order.updateOrder);
router.get("/fetch/all", Order.fetchBookings);
// router.delete("/delete", Order.deleteOrder);
router.post("/cancel", Order.cancelBooking);
router.get("/fetch/recent", Order.fetchRecentBookedProducts);

module.exports = router