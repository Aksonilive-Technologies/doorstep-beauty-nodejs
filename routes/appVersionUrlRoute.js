const express = require("express");
const { updateAppVersion } = require("../controller/appVersionUrlController");
const router = express.Router();
const app = express();

router.post("/update", updateAppVersion);

module.exports = router;
