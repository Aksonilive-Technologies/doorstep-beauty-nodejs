const { default: mongoose } = require("mongoose");
const Customer = require("../models/customerModel");
const Feedback = require("../models/feedbackModel");

const createFeedback = async (req, res) => {
  const { rating, review, suggestedImprovement, productId } = req.body;
  const { id } = req.query;

  // Validate id
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid user ID format" });
  }

  try {
    // Check if customer exists
    const customer = await Customer.findById(id).lean();
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    // Validate required fields
    if (!rating && !suggestedImprovement && review && rating) {
      return res.status(400).json({
        success: false,
        message: "Please add atleast one field",
      });
    }

    // Create feedback
    const feedback = new Feedback({
		customerId:id,
      rating,
      review,
      suggestedImprovement,
      productId,
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: "Feedback created successfully",
      data: feedback,
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Error creating feedback:", error);

    res.status(500).json({
      success: false,
      message: "Error creating feedback",
      error: error.message,
    });
  }
};

const getAllFeedback = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const feedback = await Feedback.find()
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const totalFeedback = await Feedback.countDocuments();

    res.status(200).json({
      message:"successfully retrived all the feedback",
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

module.exports = {
  createFeedback,
  getAllFeedback,
};
