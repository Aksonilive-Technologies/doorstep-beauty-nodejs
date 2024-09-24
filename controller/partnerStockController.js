const StockAssignment = require("../models/stockAssignmentModel.js");
const Stock = require("../models/stockModel.js");

exports.fetchAssignedStocks = async (req, res) => {
  const { partnerId } = req.body; // Default to page 1, limit 10

  try {
    if (!partnerId) {
      return res.status(400).json({
        success: false,
        message: "Partner ID is required",
      });
    }

    const stockAssignments = await StockAssignment.find({
      partner: partnerId,
      quantity: { $gt: 0 },
    })
      .populate("stock")
      .select("stock -_id")
      .lean();

    // Map to extract only the stock details
    const formattedResponse = stockAssignments.map(
      (assignment) => assignment.stock
    );

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
exports.fetchAllStocks = async (req, res) => {
  try {

    // Fetch stocks with pagination, filtering by isActive and isDeleted
    const stocks = await Stock.find({currentStock:{
      $gt:0
    }, isActive: true, isDeleted: false })
      .select("-currentStock -__v");

    // If no stocks found
    if (stocks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No item found",
      });
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      message: "Successfully retrieved all the items",
      data: stocks,
    });
  } catch (error) {
    // Handle potential errors
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the stocks",
      details: error.message,
    });
  }
};
