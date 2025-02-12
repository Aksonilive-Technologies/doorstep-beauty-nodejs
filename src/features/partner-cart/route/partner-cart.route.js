import express from "express";
const router = express.Router();
import * as Cart from "../controller/partner-cart.controller.js";
import verifyToken from "../../../../middleware/verifyToken.js";

router.post("/add-item", Cart.addItemToCart);
router.post("/create-transaction", Cart.createCartBookingTransaction);
router.post("/fetch", Cart.getCartByPartnerId);
router.post("/remove-item", Cart.removeItemFromCart);
router.post("/item/increment", Cart.incrementItemQuantity);
router.post("/item/decrement", Cart.decrementItemQuantity);
router.post("/book", Cart.bookCart);

export default router;
