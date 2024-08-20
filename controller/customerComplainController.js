const Admin = require("../models/adminModel.js");
const Complaint = require("../models/customerComplainModel.js");
const Customer = require("../models/customerModel.js");
const mongoose = require("mongoose");
// const { validationResult } = require("express-validator");

const createComplaint = async (req, res) => {
  try {
    const { customerId, description, complaintCategory } = req.body;

    // Validation rules
    const requiredFields = [
      {
        field: "customerId",
        value: customerId,
        message: "customerId is required.",
      },
      {
        field: "complaintCategory",
        value: complaintCategory,
        message: "Complaint category is required.",
      },
      {
        field: "description",
        value: description,
        message: "Description is required.",
      },
    ];

    const customerExists = await Customer.findById(customerId);
    if (!customerExists) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    }

    if (!customerExists.isActive) {
      return res.status(401).json({success:false,  message: "Customer is inactive." });
    }

    // Check for missing required fields
    for (let i = 0; i < requiredFields.length; i++) {
      if (!requiredFields[i].value) {
        return res.status(400).json({success:false,  message: requiredFields[i].message });
      }
    }

    // Check if customerId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({success:false,  message: "Invalid customerId." });
    }

    // Create a new complaint instance
    const newComplaint = new Complaint({
      customerId,
      description, // Using correct field name
      complaintCategory,
    });

    // Save the complaint to the database
    const savedComplaint = await newComplaint.save();

    return res.status(201).json({
      success: true,
      message: "Complaint created successfully",
      data: savedComplaint,
    });
  } catch (error) {
    // Handle duplicate key errors (e.g., unique fields)
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${
          duplicateField.charAt(0).toUpperCase() + duplicateField.slice(1)
        } already exists.`,
      });
    }

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success:false, 
        message: "Validation error",
        errors: messages,
      });
    }

    // General error handling
    console.error("Error while creating complaint: ", error);
    return res.status(500).json({
      success:false, 
      message: "An error occurred while creating the complaint.",
      error: error.message,
    });
  }
};

const getAllComplaints = async (req, res) => {
  try {
    // Get pagination parameters from query, with default values
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Retrieve complaints with pagination
    const complaints = await Complaint.find().skip(skip).limit(limit);

    // Get total count of complaints
    const totalComplaints = await Complaint.countDocuments();

    return res.status(200).json({
      success: true,
      message: "Complaints retrieved successfully",
      complaints,
      pagination: {
        totalComplaints,
        currentPage: page,
        totalPages: Math.ceil(totalComplaints / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success:false, 
      message: "An error occurred while retrieving complaints.",
      error: error.message,
    });
  }
};

const resolvedComplaint = async (req, res) => {
  try {
    const { complaintId } = req.query;
    const { adminId, closingRemark } = req.body;

    // Manual validation for required fields
    if (!closingRemark) {
      return res.status(400).json({
        success: false,
        message: "Resolution comment is required",
      });
    }

    if (!complaintId) {
      return res.status(400).json({
        success: false,
        message: "Complaint ID is required",
      });
    }

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "Admin ID is required",
      });
    }

    // Fetch complaint details
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Fetch admin details
    const admin = await Admin.findById(adminId).select(
      "_id name username level"
    );
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Mark complaint as resolved and add resolution details
    complaint.resolved = true;
    complaint.closingRemark = closingRemark;
    complaint.resolvedBy = admin._id; // Assign the admin's ObjectId

    await complaint.save();

    return res.status(200).json({
      success: true,
      message: "Complaint resolved successfully",
      data: {
        complaint,
        resolvedBy: {
          _id: admin._id,
          name: admin.name,
          username: admin.username,
          level: admin.level,
        },
      },
    });
  } catch (error) {
    console.error("Error resolving complaint:", error);

    return res.status(500).json({
      success: false,
      message: "An error occurred while resolving the complaint",
      error: error.message,
    });
  }
};

module.exports = { createComplaint, getAllComplaints, resolvedComplaint };
