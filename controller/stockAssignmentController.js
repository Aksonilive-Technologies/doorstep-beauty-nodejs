const StockAssignment = require("../models/stockAssignmentModel.js");
const Stock = require("../models/stockModel.js");
const Partner = require("../models/partnerModel.js");
const Admin = require("../models/adminModel.js");

exports.assignStocks = async (req, res) => {
  const { partnerId, stockItems } = req.body;
  const { superadminId } = req.query;

  if (!superadminId) {
    return res.status(400).json({
      success: false,
      message: "Superadmin ID is required",
    });
  }

  try {
    // Validate that the user is a superadmin
    const loggedInUser = await Admin.findById(superadminId);
    if (!loggedInUser || loggedInUser.role !== "all") {
      return res.status(loggedInUser ? 401 : 404).json({
        success: false,
        message: loggedInUser
          ? "You are not authorized"
          : "Superadmin not found",
      });
    }

    // Check if all required fields are present
    if (
      !partnerId ||
      !stockItems ||
      !Array.isArray(stockItems) ||
      stockItems.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Partner ID and stock items are required",
      });
    }

    // Validate partner existence
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res
        .status(404)
        .json({ success: false, message: "Partner not found" });
    }

    // Check and update stock quantities
    const stockUpdates = stockItems.map(async (item) => {
      const stock = await Stock.findById(item.stockId);

      if (!stock) {
        throw new Error(`Stock item with ID ${item.stockId} not found`);
      }

      if (stock.currentStock < item.quantity) {
        throw new Error(`Insufficient stock for item: ${stock.name}`);
      }

      // Deduct the stock from currentStock
      stock.currentStock -= item.quantity;
      return stock.save();
    });

    // Await all stock updates to ensure transactions are processed
    await Promise.all(stockUpdates);

    // Create the stock assignment
    const stockAssignment = new StockAssignment({
      partner: partnerId,
      stockItems: stockItems.map(({ stockId, quantity }) => ({
        stock: stockId,
        quantity,
      })),
    });

    // Save the stock assignment
    await stockAssignment.save();

    // Respond with success
    res.status(201).json({
      success: true,
      message: "Successfully assigned stocks to the partner",
      data: stockAssignment,
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({
      success: false,
      message: "Error while assigning stocks",
      error: error.message,
    });
  }
};
exports.fetchAllStockAssignments = async (req, res) => {
  try {
    const { page = 1 } = req.query; // Get the page number from the query, default to 1
    const limit = 10; // Limit to 10 stock assignments per page
    const skip = (page - 1) * limit; // Calculate how many documents to skip

    // Fetch the stock assignments with pagination
    const stockAssignments = await StockAssignment.find()
      .populate("partner", "name email image mobile") // Optionally populate partner details
      .populate("stockItems.stock", "name brand size") // Optionally populate stock details
      .skip(skip)
      .limit(limit)
      .lean();

    // Check if there are no assignments
    if (stockAssignments.length === 0) {
      return res.status(200).json({
        success: true,
        data: "No data available",
        message: "No stock assignments found",
      });
    }

    const totalStockAssignments = await StockAssignment.countDocuments(); // Get the total number of stock assignments
    const totalPages = Math.ceil(totalStockAssignments / limit); // Calculate total pages

    // Respond with paginated data
    res.status(200).json({
      success: true,
      message: "Successfully fetched all stock assignments",
      data: stockAssignments,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({
      success: false,
      message: "Error while fetching stock assignments",
      error: error.message,
    });
  }
};
