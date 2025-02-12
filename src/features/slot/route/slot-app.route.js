import express from "express";
const router = express.Router();
import * as slotController from "../controller/slot-app.controller.js";

// Create a new slot

router.get("/fetch/all", slotController.getSlotsCustomer);

export default router;
