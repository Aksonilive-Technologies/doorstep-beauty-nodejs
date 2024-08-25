const Customer = require("../models/customerModel.js");
const Membership = require("../models/membershipModel.js");
const Plan = require("../models/customerMembershipPlan.js"); // Assuming this is the correct path for your Plan model
const Transaction = require("../models/transactionModel.js");

exports.buyMembershipPlan = async (req, res) => {
  // const { customerId } = req.query;
  const { customerId } = req.body;

  try {
    // Find the customer by ID
    const customer = await Customer.findById(customerId);

    // Check if customer exists
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    // Check if customer is active and not deleted
    if (!customer.isActive || customer.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Customer is not eligible for membership",
      });
    }

    const { membershipId, paymentGateway } = req.body;

    // Find the membership by ID
    const membership = await Membership.findById(membershipId);

    // Check if membership exists
    if (!membership) {
      return res
        .status(404)
        .json({ success: false, message: "Membership not found" });
    }

    // Check if customer is active and not deleted
    if (!membership.isActive || membership.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Membership not found.",
      });
    }

    console.log(membership);

    // Create a transaction record with status "Pending"
    const transaction = new Transaction({
      customerId: customerId,
      transactionType: "membership_plan_purchase",
      amount: membership.discountedPrice,
      paymentGateway: paymentGateway,
    });

    // Save the transaction record
    await transaction.save();

    res.status(200).json({
      success: true,
      message: `₹${membership.discountedPrice} transaction initiated by ${
        customer.name
      } for ${
        membership.tenure + " " + membership.tenureType
      } membership plan purchase.`,
      data: { Transaction: transaction },
    });
  } catch (error) {
    console.error("Error while purchasing membership plan :", error);
    res.status(500).json({
      success: false,
      message: "Error while purchasing membership plan.",
      errorMessage: error.message,
    });
  }
};

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
