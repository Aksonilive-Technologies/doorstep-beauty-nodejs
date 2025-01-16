const Membership = require("../models/membershipModel.js");
const PlanPurchaseHistory = require("../models/PlanPurchaseHistoryModel.js");
const Transaction = require("../models/transactionModel.js");
const Customer = require("../models/customerModel.js");
const Membership = require("../models/membershipModel.js");
const Transaction = require("../models/transactionModel.js");
const PlanPurchaseHistory = require("../models/PlanPurchaseHistoryModel.js");
const {createOrder} = require("../helper/razorpayHelper.js")

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

    const isPlanActive = await PlanPurchaseHistory.findOne({
      customer: customerId,
      isActive: true,
      isDeleted: false,
      isValid: true,
    });

    if (isPlanActive) {
      return res.status(400).json({
        success: false,
        message: "One plan is already active",
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

    const orderId = await createOrder(Number(membership.discountedPrice)*100);

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
      data: { Transaction: transaction, OrderId: orderId },
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

exports.getAllMembership = async (req, res) => {
  const { customerId } = req.body; // Assuming customerId is passed as a route parameter
  const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
  const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not provided
  // console.log(customerId, typeof customerId);

  try {
    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Fetch memberships from the database
    const memberships = await Membership.find({
      isActive: true,
      isDeleted: false,
    })
      .skip(skip)
      .limit(limit)
      .lean();

    // Count the total number of matching documents
    const totalPlans = await Membership.countDocuments({
      isActive: true,
      isDeleted: false,
    });

    const plan = await PlanPurchaseHistory.findOne({
      customer: customerId,
      isValid: true,
      isActive: true,
      isDeleted: false,
    });
    console.log("29", plan);



    if (plan !== null) {
      for (let i = 0; i < memberships.length; i++) {
        console.log("43", memberships[i]._id),
        console.log("44", plan.membership)
        if (plan.membership.toString() === memberships[i]._id.toString()) {
          memberships[i].isActivePlan = true;
        } else {
          memberships[i].isActivePlan = false;
        }
      }
    }



    
    const totalPages = Math.ceil(totalPlans / limit);


    return res.status(200).json({
      success: true,
      data: {
        memberships,
      },
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

exports.updateMembershipTransactionStatus = async (req, res) => {
  const { transactionId, status, paymentGatewayId, membershipId } = req.body;

  if (!transactionId || !status || !membershipId) {
    return res.status(400).json({
      success: false,
      message: "Transaction ID membershipId, and status are required",
    });
  }

  try {
    const transactionRecord = await Transaction.findOne({
      _id: transactionId,
      isDeleted: false,
    });

    // const membership = await M

    if (!transactionRecord) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found with given ID" + transactionId,
      });
    }

    if (transactionRecord.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Transaction is already marked as ${transactionRecord.status}`,
      });
    }

    if (status === "completed") {
      // Update the transaction status to "Completed"
      transactionRecord.status = "completed";
      transactionRecord.transactionRefId = paymentGatewayId;
      await transactionRecord.save();

      const plan = new PlanPurchaseHistory({
        customer: transactionRecord.customerId,
        membership: membershipId,
      });

      await plan.save();

      return res.status(200).json({
        success: true,
        message: `Transaction updated successfully, membership plan purchased successfully.`,
        data: { Transaction: transactionRecord },
      });
    } else if (status === "failed") {
      // Update the transaction status to "failed"
      transactionRecord.status = "failed";
      await transactionRecord.save();

      return res.status(200).json({
        success: true,
        message: "Transaction marked as failed, no plan purchased.",
        data: { Transaction: transactionRecord },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }
  } catch (error) {
    console.error("Error updating transaction status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating transaction status",
      errorMessage: error.message,
    });
  }
};

exports.getActivePlan = async (req, res) => {
  const { customerId } = req.query;

  try {
    // Validate the customerId
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    const plan = await PlanPurchaseHistory.findOne({
      customer: customerId,
      isValid: true,
      isActive: true,
      isDeleted: false,
    });

    if(!plan){
      return res.status(404).json({
        success: false,
        message: "No active membership plan found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Active membership plan fetched successfully",
      data: plan,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};