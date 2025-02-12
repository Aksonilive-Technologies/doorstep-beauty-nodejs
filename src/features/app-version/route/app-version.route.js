import express from "express";
import { updateAppVersion } from "../controller/app-version.controller.js";
const router = express.Router();
const app = express();

router.post("/update", updateAppVersion);

export default router;
