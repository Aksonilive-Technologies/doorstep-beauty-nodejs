const express = require("express");
const { updateAppVersion } = require("../controller/appVersionController");
const router = express.Router();
const app = express();

router.post("/update", updateAppVersion);

module.exports = router;
