import express from "express";
const router = express.Router();
import * as bannerController from "../controller/banner-app.controller.js";

router.get("/all", bannerController.getBannerForApp);

export default router;
