import mongoose from "mongoose";
import Feedback from "../model/feedback.model.js";
import Customer from "../../customer/model/customer.model.js";

export const getAllFeedback = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const feedback = await Feedback.find({isDeleted: false})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const totalFeedback = await Feedback.countDocuments();

    res.status(200).json({
      message: "successfully retrived all the feedback",
      success: true,
      data: feedback,
      totalFeedback,
      currentPage: page,
      totalPages: Math.ceil(totalFeedback / limit),
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Error fetching feedback:", error);

    res.status(500).json({
      success: false,
      message: "Error fetching feedback",
      error: error.message,
    });
  }
};

export default {
  getAllFeedback,
};
