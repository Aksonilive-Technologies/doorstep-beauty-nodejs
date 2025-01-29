const express = require("express");
const router = express.Router();
const Cart = require("../controller/partner-cart.controller");
const verifyToken = require("../../../../middleware/verifyToken");

router.post("/add-item", Cart.addItemToCart);
router.post("/create-transaction", Cart.createCartBookingTransaction);
router.post("/fetch", Cart.getCartByPartnerId);
router.post("/remove-item", Cart.removeItemFromCart);
router.post("/item/increment", Cart.incrementItemQuantity);
router.post("/item/decrement", Cart.decrementItemQuantity);
router.post("/book", Cart.bookCart);

module.exports = router;
