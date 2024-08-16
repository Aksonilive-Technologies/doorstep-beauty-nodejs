const Admin = require("../models/adminModel.js");
const Complaint = require("../models/customerComplainModel.js");

const generateComplaintId = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let complaintId = "";
  for (let i = 0; i < 14; i++) {
    complaintId += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return complaintId;
};

const createComplaint = async (req, res) => {
  try {
    const { name, email, phone, complaintDescription, complaintCategory } =
      req.body;

    // Validation rules
    const requiredFields = [
      { field: "name", value: name, message: "Name is required." },
      { field: "email", value: email, message: "Email is required." },
      { field: "phone", value: phone, message: "Phone number is required." },
      {
        field: "complaintCategory",
        value: complaintCategory,
        message: "Complaint category is required.",
      },
      {
        field: "complaintDescription",
        value: complaintDescription,
        message: "Complaint description is required.",
      },
    ];

    // Regex patterns for validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    const phoneRegex = /^\d{10}$/;

    // Check for missing required fields
    for (let i = 0; i < requiredFields.length; i++) {
      if (!requiredFields[i].value) {
        return res.status(400).json({ message: requiredFields[i].message });
      }
    }

    // Additional validations
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address." });
    }
    console.log("emailverifed")

    if (!phoneRegex.test(phone)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid 10-digit phone number." });
    }

    // Generate a 14-character complaint ID
    console.log("phoneverifed")
    const complaintId = generateComplaintId();

    console.log("generateComplaintId = ", complaintId)

    // Create a new complaint
    const newComplaint = new Complaint({
      name,
      email,
      phone,
      complaintId,
      complaintDescription,
      complaintCategory,
    });

    console.log("newComplaint = ", newComplaint);

    // Save the complaint to the database
    const savedComplaint = await newComplaint.save();
    console.log("not coming")

    return res.status(201).json({
      message: "Complaint created successfully",
      complaint: savedComplaint,
    });
  } catch (error) {
    // Handle duplicate key errors for email or phone
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `${
          duplicateField.charAt(0).toUpperCase() + duplicateField.slice(1)
        } already exists.`,
      });
    }

    return res.status(500).json({
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
    const complaints = await Complaint.find()
      .skip(skip)
      .limit(limit);

    // Get total count of complaints
    const totalComplaints = await Complaint.countDocuments();

    return res.status(200).json({
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
      message: "An error occurred while retrieving complaints.",
      error: error.message,
    });
  }
};

const resolvedComplaint = async (req, res) => {
  try {
    const { complaintId } = req.query;
    const { adminId } = req.body;

    //check lagao for resolution comment

    // Validate inputs
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

    // Fetch complaint and admin details
    const complaint = await Complaint.findById(complaintId);
    const admin = await Admin.findById(adminId);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Mark complaint as resolved
    complaint.resolved = true;
    await complaint.save();

    return res.status(200).json({
      success: true,
      message: "Complaint resolved successfully",
      data: { complaint : complaint, resolvedBy: admin },
    });
  } catch (error) {
    // Log the error for debugging purposes
    console.error("Error resolving complaint:", error);

    return res.status(500).json({
      success: false,
      message: "An error occurred while resolving the complaint",
      error: error.message,
    });
  }
};


module.exports = { createComplaint, getAllComplaints, resolvedComplaint };