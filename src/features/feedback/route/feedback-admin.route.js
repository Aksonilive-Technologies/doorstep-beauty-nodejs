const express = require("express");
const router = express.Router();
const app = express();
const {
  getAllFeedback,
  searchFeedback,
} = require("../controller/feedback-admin.controller");

// router.post("/create", createFeedback);

router.get("/fetch/all", getAllFeedback);
router.get("/search-feedback", searchFeedback);

module.exports = router;
