import mongoose from "mongoose";
import Feedback from "../model/feedback.model.js";
import Customer from "../../customer/model/customer.model.js";

export const createFeedback = async (req, res) => {
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
    const customer = await Customer.findById(id);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    // console.log("customer", customer);
    // Validate required fields
    if (!rating && !suggestedImprovement && !review) {
      return res.status(400).json({
        success: false,
        message: "Please add atleast one field",
      });
    }

    // Create feedback
    const feedback = new Feedback({
      customerId: id,
      customer: customer.toObject(),
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

export default {
  createFeedback,
};
