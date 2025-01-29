const express = require("express");
const router = express.Router();
const slotController = require("../controller/slot-admin.controller");

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

module.exports = router;
