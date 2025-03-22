import express from "express";
const router = express.Router();
import * as Product from "../controller/product-app.controller.js"; // Update the path accordingly

router.get("/fetch/new", Product.getAllNewProducts);
router.get("/fetch/free", Product.getAllFreeProducts);
router.get("/fetch/all", Product.getAllProducts);

export default router;
