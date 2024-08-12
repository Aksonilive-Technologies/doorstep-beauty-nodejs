const Stock = require("../models/stockModel");
const mongoose = require("mongoose");

exports.createStock = async (req, res) => {
  const requiredFields = [
    "name",
    "brand",
    "size",
    "currentStock",
    "mrp",
    "purchasingRate",
    "barcodeNumber",
  ];

  // Check for missing fields
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      error: ` ${missingFields.join(", ")} are required fields`,
    });
  }

  try {
    // Create the stock item
    const stock = await Stock.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Stock created successfully",
      stock,
    });
  } catch (error) {
    // Handle potential errors, e.g., validation errors or database errors
    return res.status(500).json({
      success: false,
      error: "An error occurred while creating the stock",
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

    // Fetch stocks with pagination
    const stocks = await Stock.find().skip(skip).limit(limit);

    // Count the total number of documents for pagination calculation
    const totalStocks = await Stock.countDocuments();
    const totalPages = Math.ceil(totalStocks / limit);

    // If no stocks found
    // if (stocks.length === 0) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "No stocks found",
    //   });
    // }

    // Return successful response
    return res.status(200).json({
      success: true,
      message: "Successfully retrieved all the stocks",
      data:stocks,
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

//delete stocks
exports.deleteStock = async (req, res) => {
  try {
    const { id } = req.query;

    // Check if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    // Find the stock by ID
    const stock = await Stock.findById(id);

    // Check if the stock exists
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock not found",
      });
    }

    // Check if the stock is already marked as deleted
    if (stock.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Stock is already deleted. Please contact the support team.",
      });
    }

    // Mark the stock as deleted
    stock.isDeleted = true;
    await stock.save();

    // Return successful response
    return res.status(200).json({
      success: true,
      message: "Stock deleted successfully",
    });
  } catch (error) {
    // Handle potential errors
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the stock",
      details: error.message,
    });
  }
};

exports.changeStatus = async (req, res) => {
  try {
    const { id } = req.query;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Stock ID",
      });
    }

    // Find the stock
    const stock = await Stock.findById(id);

    // Check if the stock exists
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock not found",
      });
    }

    // Toggle the isActive status
    stock.isActive = !stock.isActive;
    const updatedStock = await stock.save();

    // Success response
    return res.status(200).json({
      success: true,
      message: `Stock is now ${
        updatedStock.isActive ? "active" : "deactivated"
      }`,
      
    });
  } catch (err) {
    // Log the error and send a generic error message
    console.error("Error updating stock status:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating stock status",
      errorMessage: err.message,
    });
  }
};
