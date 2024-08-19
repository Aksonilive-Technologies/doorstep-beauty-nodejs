const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    review: {
      type: String,
      trim: true,
      maxlength: 1000, // Limit the review length for database optimization
    },
    suggestedImprovement: {
      type: String,
      trim: true,
      maxlength: 1000, // Limit the suggestion length for consistency
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);
// Create the model
const Feedback = mongoose.model("Feedback", feedbackSchema);
//export the model
module.exports = Feedback;

