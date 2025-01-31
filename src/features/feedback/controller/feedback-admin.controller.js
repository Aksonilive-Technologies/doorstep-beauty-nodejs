const { default: mongoose } = require("mongoose");
const Feedback = require("../model/feedback.model");
const Customer = require("../../customer/model/customer.model");

const getAllFeedback = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const feedback = await Feedback.find()
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

const searchFeedback = async (req, res) => {
  const { query } = req.query;
  const { page = 1, limit = 10 } = req.query;

  try {
    // Define search conditions dynamically based on query parameters
    let searchCondition = {};

    if (query) {
      searchCondition = {
        $or: [
          { review: { $regex: query, $options: "i" } }, // Case-insensitive search on review
          { suggestedImprovement: { $regex: query, $options: "i" } }, // Case-insensitive search on suggested improvement
          { rating: !isNaN(query) ? Number(query) : undefined }, // Search by rating if the query is a number
          { "customer.name": { $regex: query, $options: "i" } }, // Case-insensitive search on customer name
          { "customer.mobile": { $regex: query, $options: "i" } }, // Case-insensitive search on customer name
        ],
      };
    }

    // Find the feedbacks matching the search condition
    const feedback = await Feedback.find(searchCondition)
      .sort({ createdAt: -1 }) // Sort by latest feedback
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Get total count of feedback matching the search condition
    const totalFeedback = await Feedback.countDocuments(searchCondition);

    if (feedback.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No feedback found matching the search criteria",
      });
    }

    // Return the search results along with pagination details
    res.status(200).json({
      success: true,
      message: "Feedback retrieved successfully",
      data: feedback,
      totalFeedback,
      currentPage: page,
      totalPages: Math.ceil(totalFeedback / limit),
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Error searching feedback:", error);

    res.status(500).json({
      success: false,
      message: "Error occurred while searching feedback",
      error: error.message,
    });
  }
};

module.exports = {
  getAllFeedback,
  searchFeedback,
};
