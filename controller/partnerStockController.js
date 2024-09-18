const StockAssignment = require("../models/stockAssignmentModel.js");

exports.fetchAssignedStocks = async (req, res) => {
  const { partnerId} = req.body; // Default to page 1, limit 10

  try {
    if (!partnerId) {
      return res.status(400).json({
        success: false,
        message: "Partner ID is required",
      });
    }

    const stockAssignments = await StockAssignment.find({ partner: partnerId, quantity: { $gt: 0 } }).populate("stock")
    .select("stock -_id").lean();

    // Map to extract only the stock details
    const formattedResponse = stockAssignments.map(assignment => assignment.stock);

    // Return successful response
    return res.status(200).json({
      success: true,
      message: "Successfully retrieved all the assigned stocks",
      data: formattedResponse,
    });
  } catch (error) {
    // Handle potential errors
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the assigned stocks",
      details: error.message,
    });
  }
};