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
    // Set default pagination values if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch stocks with pagination, filtering by isActive and isDeleted
    const stocks = await Stock.find({ isActive: true, isDeleted: false })
      .select("-currentStock -__v")
      .skip(skip)
      .limit(limit);

    // Count the total number of documents for pagination calculation
    const totalStocks = await Stock.countDocuments({
      isActive: true,
      isDeleted: false,
    });
    const totalPages = Math.ceil(totalStocks / limit);

    // If no stocks found
    if (stocks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active stocks found",
      });
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      message: "Successfully retrieved all the active stocks",
      data: stocks,
      currentPage: page,
      totalPages,
      totalStocks,
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
