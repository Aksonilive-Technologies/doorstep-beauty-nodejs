import Admin from "../../admin/model/admin.model.js";
import Complaint from "../model/complaint.model.js";
import Customer from "../../customer/model/customer.model.js";
// import { validationResult } from "express-validator";

export const getAllComplaints = async (req, res) => {
  try {
    // Get pagination parameters from query, with default values
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Retrieve complaints with pagination and populate customer details
    const data = await Complaint.find({isDeleted: false})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("customerId"); // Populates the customer details using customerId

    // Get total count of complaints
    const totalComplaints = await Complaint.countDocuments();

    return res.status(200).json({
      success: true,
      message: "Complaints retrieved successfully",
      data, // Data now includes populated customer details
      totalComplaints,
      currentPage: page,
      totalPages: Math.ceil(totalComplaints / limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving complaints.",
      error: error.message,
    });
  }
};

export const resolvedComplaint = async (req, res) => {
  try {
    const { complaintId } = req.query;
    const { adminId, closingRemark } = req.body;

    // Manual validation for required fields
    if (!closingRemark) {
      return res.status(400).json({
        success: false,
        message: "closing remark is required",
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

export const getComplaintStatsByCategory = async (req, res) => {
  try {
    // Aggregate complaints grouped by complaintCategory and count each category
    const complaintStats = await Complaint.aggregate([
      {
        $match: {
          isDeleted: false, // Only consider active complaints
        },
      },
      {
        $group: {
          _id: "$complaintCategory", // Group by complaint category
          complaintCount: { $sum: 1 }, // Count complaints per category
        },
      },
      {
        $sort: { complaintCount: -1 }, // Optional: sort by highest count
      },
    ]);

    // Calculate total count of complaints for percentage calculation
    const totalCount = complaintStats.reduce(
      (sum, stat) => sum + stat.complaintCount,
      0
    );

    // Prepare data for pie chart, including percentage for each category
    const pieChartData = complaintStats.map((stat) => ({
      category: stat._id,
      count: stat.complaintCount,
      percentage: ((stat.complaintCount / totalCount) * 100).toFixed(2), // Calculate and format percentage
    }));

    res.status(200).json({
      success: true,
      message: "Complaint stats by category retrieved successfully",
      data: pieChartData,
      totalCount, // Include total count in response
    });
  } catch (error) {
    console.error("Error fetching complaint stats by category:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching complaint stats by category",
      errorMessage: error.message,
    });
  }
};

export const getResolvedComplaintStatsByCategory = async (req, res) => {
  try {
    // Get count of resolved complaints grouped by category
    const resolvedComplaintStats = await Complaint.aggregate([
      {
        $match: {
          isDeleted: false, // Only consider active complaints
          resolved: true, // Only include resolved complaints
        },
      },
      {
        $group: {
          _id: "$complaintCategory", // Group by complaint category
          resolvedCount: { $sum: 1 }, // Count resolved complaints per category
        },
      },
      {
        $sort: { resolvedCount: -1 }, // Optional: sort by highest count
      },
    ]);

    // Get total count of unresolved complaints
    const unresolvedComplaintCount = await Complaint.countDocuments({
      isDeleted: false,
      resolved: false,
    });

    // Format the resolved data for charting
    const resolvedPieChartData = resolvedComplaintStats.map((stat) => ({
      category: stat._id,
      resolvedCount: stat.resolvedCount,
    }));

    res.status(200).json({
      success: true,
      message:
        "Resolved complaint stats by category and unresolved total count retrieved successfully",
      data: {
        resolvedByCategory: resolvedPieChartData,
        unresolvedTotalCount: unresolvedComplaintCount,
      },
    });
  } catch (error) {
    console.error(
      "Error fetching resolved complaint stats by category:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error fetching resolved complaint stats by category",
      errorMessage: error.message,
    });
  }
};

export default {
  getAllComplaints,
  resolvedComplaint,
  getComplaintStatsByCategory,
  getResolvedComplaintStatsByCategory,
};
