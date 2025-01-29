const express = require("express");
const router = express.Router();
const bannerController = require("../controller/banner-app.controller");

router.get("/all", bannerController.getBannerForApp);

module.exports = router;
