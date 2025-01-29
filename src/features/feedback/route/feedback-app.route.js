const express = require("express");
const router = express.Router();
const app = express();
const {
  createFeedback,
  getAllFeedback,
} = require("../controller/feedback-app.controller");

router.post("/create", createFeedback);

// router.get("/fetch/all", getAllFeedback);

module.exports = router;
