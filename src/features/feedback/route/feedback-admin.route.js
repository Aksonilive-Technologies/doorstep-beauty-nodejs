import express from "express";
const router = express.Router();
const app = express();
import {
  getAllFeedback,
} from "../controller/feedback-admin.controller.js";

router.get("/fetch/all", getAllFeedback);

export default router;
