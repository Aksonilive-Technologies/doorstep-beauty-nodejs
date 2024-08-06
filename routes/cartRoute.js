const express = require("express");
router = express.Router();
const Cart = require("../controller/cartController");
const verifyToken = require("../middleware/verifyToken");





router.post("/add-item", verifyToken, Cart.addItemToCart);
router.put("/update", verifyToken, Cart.updateCartItem);
router.get("/fetch/single", verifyToken, Cart.getCartByCustomerId);
router.post('/remove-item',verifyToken, Cart.removeItemFromCart);
router.post('/clear',verifyToken, Cart.emptyCart);



module.exports = router