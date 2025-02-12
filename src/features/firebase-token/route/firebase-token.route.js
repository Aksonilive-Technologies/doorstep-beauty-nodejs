import express from "express";
const router = express.Router();

import { updateFirebaseToken } from "../controller/firebase-token.controller.js";

router.post("/update", updateFirebaseToken);

export default router;
