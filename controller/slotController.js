const { default: mongoose } = require("mongoose");
const Slot = require("../models/slotModel");

// Create a new slot
// Enhanced Slot creation function with validation and better error handling
exports.createSlot = async (req, res) => {
  try {
    const { startTime, clockCycle } = req.body;

    // Input validation
    if (!startTime || !clockCycle) {
      return res.status(400).json({
        success: false,
        message: "startTime and clockCycle are required fields.",
        data: null,
      });
    }

    // Creating a new slot instance
    const newSlot = new Slot({ startTime, clockCycle });

    // Saving the slot to the database
    await newSlot.save();

    // Successful response
    res.status(201).json({
      success: true,
      message: "Slot created successfully",
      data: newSlot,
    });
  } catch (err) {
    // Error handling
    res.status(500).json({
      success: false,
      message: "An error occurred while creating the slot",
      data: null,
    });
  }
};

// Update a slot
exports.updateSlot = async (req, res) => {
  try {
    const { id } = req.query;

    // Validate the ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing slot ID",
        data: null,
      });
    }

    // Attempt to update the slot
    const updatedSlot = await Slot.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true, // Ensures the update obeys schema validations
    });

    // If the slot was not found
    if (!updatedSlot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found",
        data: null,
      });
    }

    // Successful update response
    res.status(200).json({
      success: true,
      message: "Slot updated successfully",
      data: updatedSlot,
    });
  } catch (error) {
    // Error handling
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the slot",
      data: null,
      error: error.message,
    });
  }
};

// Get all slots
exports.getSlots = async (req, res) => {
  try {
    // Retrieve all slots
    const slots = await Slot.find();

    // Successful response
    res.status(200).json({
      success: true,
      message: "Slots retrieved successfully",
      data: slots,
    });
  } catch (err) {
    // Error handling
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving slots",
      data: null,
      error: err.message,
    });
  }
};

// Delete a slot (soft delete)
// Soft delete a slot
exports.deleteSlot = async (req, res) => {
  try {
    const { id } = req.query;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid slot ID",
        data: null,
      });
    }

    // Soft delete by setting `isDeleted` to true
    const deletedSlot = await Slot.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    // If the slot was not found
    if (!deletedSlot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found",
        data: null,
      });
    }

    // Successful deletion response
    res.status(200).json({
      success: true,
      message: "Slot deleted successfully",
      data: deletedSlot,
    });
  } catch (err) {
    // Error handling
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the slot",
      data: null,
      error: err.message,
    });
  }
};

// Change slot status
exports.changeSlotStatus = async (req, res) => {
  try {
    const { id } = req.query;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid slot ID",
        data: null,
      });
    }

    // Find the slot
    const slot = await Slot.findById(id);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found",
        data: null,
      });
    }

    // Toggle the slot's status
    slot.isActive = !slot.isActive;
    await slot.save();

    // Successful response
    res.status(200).json({
      success: true,
      message: `Slot is ${slot.isActive ? "activated" : "deactivated"}`,
      data: slot,
    });
  } catch (err) {
    // Error handling
    res.status(500).json({
      success: false,
      message: "An error occurred while changing the slot status",
      data: null,
      error: err.message,
    });
  }
};


exports.getSlotsCustomer = async (req, res) => {
  try {
    // Retrieve all slots
    const slots = await Slot.find({
      isActive:true,
      isDeleted:false,
    });

    // Successful response
    res.status(200).json({
      success: true,
      message: "Slots retrieved successfully",
      data: slots,
    });
  } catch (err) {
    // Error handling
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving slots",
      data: null,
      error: err.message,
    });
  }
};