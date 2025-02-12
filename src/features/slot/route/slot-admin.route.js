import express from "express";
const router = express.Router();
import * as slotController from "../controller/slot-admin.controller.js";

// Create a new slot
router.post("/create", slotController.createSlot);

// Update a slot
router.put("/update", slotController.updateSlot);

// Get all slots
router.get("/get", slotController.getSlots);

// Delete a slot (soft delete)
router.put("/delete", slotController.deleteSlot);

// Change slot status
router.put("/change-status", slotController.changeSlotStatus);

router.get("/search-slot", slotController.searchSlots);

export default router;
