const Customer = require("../models/customerModel.js");
const Plan = require("../models/customerMembershipPlan.js"); // Assuming this is the correct path for your Plan model


exports.getPlansByCustomerId = async (req, res) => {
  const { customerId } = req.query;
  const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
  const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not provided
  console.log("custrmerID", customerId);
  const customeror = Customer.findById({ customerId });
  console.log(customeror);
  try {
    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Find all plans associated with the customerId that are valid, active, and not deleted
    const plans = await Plan.find({
      customer: customerId,
      isValid: true,
      isActive: true,
      isDeleted: false,
    })
      .populate("membership")
      .skip(skip)
      .limit(limit);

    // Count the total number of matching documents
    const totalPlans = await Plan.countDocuments({
      customer: customerId,
      isValid: true,
      isActive: true,
      isDeleted: false,
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalPlans / limit);

    // Check if any plans were found
    if (!plans.length) {
      return res.status(404).json({
        success: false,
        message: "No valid plans found for this customer.",
      });
    }

    return res.status(200).json({
      success: true,
      plans,
      pagination: {
        totalPlans,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
