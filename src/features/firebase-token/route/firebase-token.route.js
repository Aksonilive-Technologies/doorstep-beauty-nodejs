const express = require("express");
const router = express.Router();

const {
  updateFirebaseToken,
} = require("../controller/firebase-token.controller");

router.post("/update", updateFirebaseToken);

module.exports = router;
