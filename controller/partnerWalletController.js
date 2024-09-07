const Partner = require("../models/partnerModel.js");
const jwt = require("jsonwebtoken");
const generateCode = require("../helper/generateCode.js");
const generateRandomCode = require("../helper/generateCode.js");
const { cloudinary } = require("../config/cloudinary");
const PartnerTransaction = require("../models/partnerTransactionModel.js");
const ServicablePincode = require('../models/servicablePincodeModel');
const { partnerById } = require("./partnerController.js");

// Add money to wallet
exports.addMoneyToWallet = async (req, res) => {
  const { id, amount, paymentGateway } = req.body;

  if (!id || !amount || !paymentGateway) {
    return res.status(400).json({
      success: false,
      message: "Partner ID ,payment Gateway and amount are required",
    });
  }

  try {
    // Find the partner
    const partnerRecord = await Partner.findOne({
      _id: id,
      isActive: true,
      isDeleted: false,
    });

    if (!partnerRecord) {
      return res.status(404).json({
        success: false,
        message:
          "Partner not found, may be deleted or deactivated temporarily",
      });
    }

    // Create a transaction record with status "Pending"
    const partnerTransaction = new PartnerTransaction({
      partnerId: id,
      transactionType: "recharge_wallet",
      amount: Number(amount),
      paymentGateway: paymentGateway,
    });

    // Save the transaction record
    await partnerTransaction.save();

    res.status(200).json({
      success: true,
      message: `₹${amount} recharge initiated for ${partnerRecord.name}'s wallet.`,
      data: { Transaction: partnerTransaction },
    });
  } catch (error) {
    console.error("Error adding money to wallet:", error);
    res.status(500).json({
      success: false,
      message: "Error adding money to wallet",
      errorMessage: error.message,
    });
  }
};

// // Debit money from wallet
// exports.debitMoneyFromWallet = async (req, res) => {
//   const { id, amount } = req.body;

//   if (!id || !amount) {
//     return res.status(400).json({
//       success: false,
//       message: "Partner ID and amount are required",
//     });
//   }

//   try {
//     const partner = await partner.findOne({
//       _id: id,
//       isActive: true,
//       isDeleted: false,
//     });

//     if (!partnerRecord || partner.length === 0 || partner === null) {
//       return res.status(404).json({
//         success: false,
//         message: "Partner not found,may be deleted or deactivated temporarily",
//       });
//     }

//     if (partner.walletBalance < amount) {
//       return res.status(400).json({
//         success: false,
//         message: "Insufficient balance in the wallet",
//       });
//     }

//     partner.walletBalance -= amount;
//     await partner.save();

//     res.status(200).json({
//       success: true,
//       message: `₹${amount} debited from wallet successfully`,
//     });
//   } catch (error) {
//     console.error("Error debiting money from wallet:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error debiting money from wallet",
//       errorMessage: error.message,
//     });
//   }
// };

exports.getWalletBalance = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Partner ID {id} is required" });
    }
    const partner = await Partner.findOne({
      _id: id,
      isActive: true,
      isDeleted: false,
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found,may be deleted or deactivated temporarily",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Wallet balance fetched successfully",
      data: { Balance: partner.walletBalance },
    });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateTransactionStatus = async (req, res) => {
  const { transactionId, status, paymentGatewayId } = req.body;

  if (!transactionId || !status) {
    return res.status(400).json({
      success: false,
      message: "Transaction ID and status are required",
    });
  }

  try {
    const partnertransactionRecord = await PartnerTransaction.findOne({
      _id: transactionId,
      isDeleted: false,
    });

    if (!partnertransactionRecord) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found with given ID" + transactionId,
      });
    }

    if (partnertransactionRecord.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Transaction is already marked as ${partnertransactionRecord.status}`,
      });
    }

    if (status === "completed") {
      // Update the transaction status to "Completed"
      partnertransactionRecord.status = "completed";
      partnertransactionRecord.transactionRefId = paymentGatewayId;
      await partnertransactionRecord.save();

      // Add money to the wallet
      const partnerRecord = await Partner.findOne({
        _id: partnertransactionRecord.partnerId,
        isDeleted: false,
        isActive: true,
      });
      if (!partnerRecord) {
        return res.status(404).json({
          success: false,
          message:
            "Partner not found,may be deleted or deactivated temporarily",
        });
      }
      partnerRecord.walletBalance += partnertransactionRecord.amount;
      await partnerRecord.save();

      return res.status(200).json({
        success: true,
        message: `Transaction updated successfully. ₹${partnertransactionRecord.amount} added to wallet.`,
        data: { Transaction: partnertransactionRecord },
      });
    } else if (status === "failed") {
      // Update the transaction status to "failed"
      partnertransactionRecord.status = "failed";
      await partnertransactionRecord.save();

      return res.status(200).json({
        success: true,
        message: "Transaction marked as failed. No money added to wallet.",
        data: { Transaction: partnertransactionRecord },
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

exports.fetchWalletTransactions = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Partner ID is required",
    });
  }

  try {
    const transactions = await PartnerTransaction.find({
      partnerId: id,
      transactionType: { $in: ["recharge_wallet", "booking_confirmation"] },
      status: "completed",

      isDeleted: false,
    }).sort({ createdAt: -1 });

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No wallet transactions found for this partner",
      });
    }


    res.status(200).json({
      success: true,
      message: "Wallet transactions fetched successfully",

      data: transactions,
    });
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching wallet transactions",
      errorMessage: error.message,
    });
  }
};