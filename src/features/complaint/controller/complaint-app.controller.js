import Admin from "../../admin/model/admin.model.js";
import Complaint from "../model/complaint.model.js";
import Customer from "../../customer/model/customer.model.js";
import mongoose from "mongoose";
// import { validationResult } from "express-validator";

export const createComplaint = async (req, res) => {
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
      return res
        .status(401)
        .json({ success: false, message: "Customer is inactive." });
    }

    // Check for missing required fields
    for (let i = 0; i < requiredFields.length; i++) {
      if (!requiredFields[i].value) {
        return res
          .status(400)
          .json({ success: false, message: requiredFields[i].message });
      }
    }

    // Check if customerId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid customerId." });
    }

    // Create a new complaint instance
    const newComplaint = new Complaint({
      customerId: customerExists,
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
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    // General error handling
    console.error("Error while creating complaint: ", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while creating the complaint.",
      error: error.message,
    });
  }
};

export const getAllComplaintWithCustomerId = async (req, res) => {
  try {
    // Get the customerId from query parameters
    const { customerId } = req.query;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "customerId is required.",
      });
    }

    // Get pagination parameters from query, with default values
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Retrieve complaints with pagination for the given customerId
    const data = await Complaint.find({ customerId })
      .skip(skip)
      .limit(limit)
      .populate("customerId"); // Populates the customer details using customerId

    // Get total count of complaints for the given customerId
    const totalComplaints = await Complaint.countDocuments({ customerId });

    return res.status(200).json({
      success: true,
      message: "Complaints retrieved successfully",
      data, // Data now includes populated customer details
      pagination: {
        totalComplaints,
        currentPage: page,
        totalPages: Math.ceil(totalComplaints / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving complaints.",
      error: error.message,
    });
  }
};

export default {
  createComplaint,
  getAllComplaintWithCustomerId,
};
