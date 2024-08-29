const express = require("express");
const {
  updateFirebaseToken,
} = require("../controller/firebaseTokenController");
const router = express.Router();
const app = express();

router.post("/update", updateFirebaseToken);

module.exports = router;
