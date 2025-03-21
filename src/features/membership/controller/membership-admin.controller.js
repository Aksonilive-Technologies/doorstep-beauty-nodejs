import mongoose from "mongoose";
import Membership from "../model/membership.model.js";
// const logger = require("../utility/logger.js");

export const createMembership = async (req, res) => {
  try {
    const requiredFields = ["tenure", "tenureType", "price"];
    const missingFields = requiredFields.filter(
      (field) => !req.body[field] || req.body[field] === null
    );

    if (missingFields.length) {
      return res.status(400).json({
        success: false,
        message: `Missing or invalid required fields: ${missingFields.join(
          ", "
        )}`,
      });
    }

    // Create a new membership
    const membership = new Membership(req.body);
    await membership.save();

    res.status(201).json({
      success: true,
      message: "Membership created successfully",
      data: membership,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const updateMembership = async (req, res) => {
  const { id } = req.query; // Use req.params to extract ID from URL
  try {
    // Validate ID format with Mongoose
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    // Check if membership exists
    const membership = await Membership.findById(id);
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    // Update membership
    const updatedMembership = await Membership.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );

    if (updatedMembership) {
      return res.status(200).json({
        success: true,
        message: "Membership updated successfully",
        data: updatedMembership,
      });
    }

    // If update fails for some reason
    res.status(500).json({
      success: false,
      message: "Failed to update membership",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error while updating the membership",
      error: error.message,
    });
  }
};

export const fetchAllMemberships = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const memberships = await Membership.find({isDeleted: false})
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }); // Sort by most recent

    // Get the total count of membership plans
    const total = await Membership.countDocuments();

    res.status(200).json({
      success: true,
      data: memberships,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      message: "Membership plans fetched successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error while fetching membership plans",
      error: error.message,
    });
  }
};

export const changeMembershipStatus = async (req, res) => {
  const { id } = req.query;

  try {
    // Validate ID format with Mongoose
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid membership ID format",
      });
    }

    // Find and toggle the isActive status in a single query
    const updatedMembership = await Membership.findByIdAndUpdate(
      id,
      [{ $set: { isActive: { $not: "$isActive" } } }], // Use MongoDB's aggregation to toggle the isActive field
      { new: true, lean: true }
    );

    if (!updatedMembership) {
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Membership has been ${
        updatedMembership.isActive ? "activated" : "deactivated"
      }`,
      data: updatedMembership,
    });
  } catch (error) {
    // Log error details internally for production-level monitoring
    // logger.error(
    //   `Error updating membership status for ID ${id}: ${error.message}`,
    //   {
    //     stack: error.stack,
    //     errorCode: error.code || "UNKNOWN_ERROR",
    //   }
    // );

    res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again later.",
      error: error.message,
    });
  }
};

export const deleteMembership = async (req, res) => {
  const { id } = req.query;

  try {
    // Validate ID format with Mongoose
    if (!mongoose.Types.ObjectId.isValid(id)) {
      // logger.warn(`Invalid membership ID format: ${id}`);
      return res.status(400).json({
        success: false,
        message: "Invalid membership ID format",
      });
    }

    // Soft delete the membership by setting isDeleted to true
    const deletedMembership = await Membership.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true } },
      { new: true, lean: true }
    );

    if (!deletedMembership) {
      // logger.warn(`Membership not found: ${id}`);
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    // Successfully deleted
    res.status(200).json({
      success: true,
      message: "Membership has been deleted",
    });
  } catch (error) {
    // Log error details for production-level monitoring
    // logger.error(`Error deleting membership for ID ${id}: ${error.message}`, {
    //   stack: error.stack,
    //   errorCode: error.code || "UNKNOWN_ERROR",
    // });

    res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again later.",
      error: error.message,
    });
  }
};

export default {
  createMembership,
  updateMembership,
  fetchAllMemberships,
  changeMembershipStatus,
  deleteMembership,
};
