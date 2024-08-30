const express = require("express");
router = express.Router();
const Order = require("../controller/bookingController")



router.post("/create", Order.bookProduct);
// router.put("/update", Order.updateOrder);
// router.get("/fetch/single", Order.getOrderById);
// router.delete("/delete", Order.deleteOrder);


module.exports = router