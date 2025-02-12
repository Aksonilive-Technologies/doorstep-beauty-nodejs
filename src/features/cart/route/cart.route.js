import express from "express";
const router = express.Router();
import * as Cart from "../controller/cart.controller.js";

router.post("/add-item", Cart.addItemToCart);
router.post("/fetch", Cart.getCartByCustomerId);
router.post("/remove-item", Cart.removeItemFromCart);
router.post("/clear", Cart.emptyCart);
router.post("/item/increment", Cart.incrementItemQuantity);
router.post("/item/decrement", Cart.decrementItemQuantity);
router.post("/book", Cart.bookCart);

export default router;
