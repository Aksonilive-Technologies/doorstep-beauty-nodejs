const express = require("express");
router = express.Router();
const Cart = require("../controller/cartController");
const verifyToken = require("../middleware/verifyToken");

router.post("/add-item", Cart.addItemToCart);
router.post("/fetch", Cart.getCartByCustomerId);
router.post("/remove-item", Cart.removeItemFromCart);
router.post("/clear", Cart.emptyCart);
router.post("/item/increment", Cart.incrementItemQuantity);
router.post("/item/decrement", Cart.decrementItemQuantity);
router.post("/book", Cart.bookCart);

module.exports = router;
