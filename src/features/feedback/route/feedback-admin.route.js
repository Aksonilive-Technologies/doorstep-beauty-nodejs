import express from "express";
const router = express.Router();
const app = express();
import {
  getAllFeedback,
  searchFeedback,
} from "../controller/feedback-admin.controller.js";

// router.post("/create", createFeedback);

router.get("/fetch/all", getAllFeedback);
router.get("/search-feedback", searchFeedback);

export default router;
