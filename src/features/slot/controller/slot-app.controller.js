const Slot = require("../model/slot.model");


exports.getSlotsCustomer = async (req, res) => {
  try {
    // Retrieve all slots
    const slots = await Slot.find({
      isActive: true,
      isDeleted: false,
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
