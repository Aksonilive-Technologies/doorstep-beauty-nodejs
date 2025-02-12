import express from "express";
const router = express.Router();
const app = express();
import {
  createFeedback
} from "../controller/feedback-app.controller.js";

router.post("/create", createFeedback);

// router.get("/fetch/all", getAllFeedback);

export default router;
