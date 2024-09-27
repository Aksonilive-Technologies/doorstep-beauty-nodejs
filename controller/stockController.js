const Stock = require("../models/stockModel");
const mongoose = require("mongoose");
const { cloudinary } = require("../config/cloudinary.js");
const Partner = require("../models/partnerModel.js");
const StockAssignment = require("../models/stockAssignmentModel.js");

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
      error: `${missingFields.join(", ")} are required fields`,
    });
  }

  let imageUrl = null;
  if (req.file) {
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "Stock",
        public_id: `${Date.now()}_${req.file.originalname.split(".")[0]}`,
        overwrite: true,
      });
      imageUrl = result.secure_url;
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "An error occurred while uploading the image",
        details: error.message,
      });
    }
  }

  try {
    // Extract fields from req.body
    const {
      name,
      brand,
      size,
      currentStock,
      mrp,
      purchasingRate,
      barcodeNumber,
    } = req.body;

    // Create the stock item
    const stock = await Stock.create({
      name,
      brand,
      size,
      currentStock,
      mrp,
      purchasingRate,
      barcodeNumber,
      image:imageUrl, // Add imageUrl if available
    });

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

exports.fetchAssignedStocks = async (req, res) => {
  const { page = 1, limit = 10 } = req.query; // Default to page 1, limit 10

  try {
    // Fetch the list of partners with pagination
    const partners = await Partner.find()
      .limit(parseInt(limit)) // Ensure limit is a number
      .skip((page - 1) * limit)
      .select("_id image name") // Only select required fields
      .lean(); // Lean for better performance

    const totalPartners = await Partner.countDocuments();

    if (partners.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No partners found",
      });
    }

    // Fetch stock assignments for all partners in a single query
    const partnerIds = partners.map(partner => partner._id);
    const stockAssignments = await StockAssignment.find({ partner: { $in: partnerIds } })
      .populate("stock") // Populate the stock field
      .lean(); // Return plain JavaScript objects

    // Map stock assignments to the respective partners
    const partnerStockMap = partners.map(partner => {
      const assignedStocks = stockAssignments.filter(sa => sa.partner.toString() === partner._id.toString())
      .map(sa => {
        // Create a new object excluding the 'partner' field
        const { partner,_id, ...rest } = sa;
        return rest;
      });
      return {
        ...partner,
        stockAssignments: assignedStocks
      };
    });

    // Return successful response
    return res.status(200).json({
      success: true,
      message: "Successfully retrieved all the assigned stocks",
      data: partnerStockMap,
      currentPage: parseInt(page),
      totalPartners,
      totalPages: Math.ceil(totalPartners / limit),
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



exports.assignStock = async (req, res) => {
  const { partnerId, assignStock } = req.body;

  try {
    // Check if all required fields are present
    if (!partnerId || !assignStock || !Array.isArray(assignStock) || assignStock.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Partner ID and valid assignStock array are required",
      });
    }

    // Validate partner existence
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    // Assign stocks
    const stockAssignments = assignStock.map(({ stock, quantity }) => {
      if (!stock || !quantity) {
        throw new Error("Each stock assignment must have a valid stock ID and quantity");
      }
      return new StockAssignment({
        partner: partnerId,
        stock: stock,
        quantity: quantity,
      });
    });

    // Save all stock assignments in parallel
    await Promise.all(stockAssignments.map(stockAssignment => stockAssignment.save()));

    // Respond with success
    res.status(201).json({
      success: true,
      message: "Successfully assigned stocks to the partner",
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
