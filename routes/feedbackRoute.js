const express = require("express");
const router = express.Router();
const app = express();
const {
  createFeedback,
  getAllFeedback,
  searchFeedback,
} = require("../controller/feedbackController");

// router.post("/create", createFeedback);

router.get("/fetch/all", getAllFeedback);
router.get("/search-feedback", searchFeedback);

module.exports = router;
