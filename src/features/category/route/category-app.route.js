import express from "express";
const router = express.Router();
import * as productAppController from "../../product/controller/product-app.controller.js";

router.get("/fetch/all", productAppController.getAllCategoryProducts);

export default router;
