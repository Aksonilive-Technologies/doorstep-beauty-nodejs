const express = require("express");
const router = express.Router();
const bannerController = require("../controller/bannerController");


router.get("/all", bannerController.getBannerForApp);

module.exports = router;
