const express = require("express");
router = express.Router();
const Cart = require("../controller/cartController");
const verifyToken = require("../middleware/verifyToken");

router.post("/add-item", Cart.addItemToCart);
router.put("/update", Cart.updateCartItem);
router.get("/fetch/single", Cart.getCartByCustomerId);
router.post("/remove-item", Cart.removeItemFromCart);
router.post("/clear", Cart.emptyCart);

module.exports = router;
