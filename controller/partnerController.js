const Partner = require("../models/PartnerModel.js");
const jwt = require("jsonwebtoken");
const generateCode = require("../helper/generateCode.js");
const generateRandomCode = require("../helper/generateCode.js");
const { cloudinary } = require("../config/cloudinary");
const Transaction = require("../models/transactionModel.js");
const ServicablePincode = require('../models/servicablePincodeModel');
//Create Register

exports.partnerById = async (req, res) => {
  const { id } = req.query;
  try {
    if (!id) {
      return res.status(404).json({
        success: false,
        message: "Partner ID is required.",
      });
    }
    const partner = await Partner.findById(id)
      .select("-__v");

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    if (partner.isDeleted === true) {
      return res.status(404).json({
        success: false,
        message: "Your account is deactivated, please contact the support team",
      });
    }
    if (partner.isActive === false) {
      return res.status(404).json({
        success: false,
        message: "Your account is suspended for now",
      });
    }

    res.status(200).json({
      success: true,
      message: "Partner fetched successfully",
      data: partner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching partner",
      errorMessage: error.message,
    });
  }
};

exports.checkExistance = async (req, res) => {
  const { mobile } = req.query;

  try {
    if (!mobile) {
      return res.status(404).json({
        success: false,
        message: "Mobile number is required",
      });
    }
    console.log(mobile);
    const partner = await Partner.findOne({ phone: mobile })
      .select("-__v");
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner with mobile number " + mobile + " not found",
      });
    }
    if (partner.isDeleted === true) {
      return res.status(404).json({
        success: false,
        message: "Your account is deactivated, please contact the support team",
      });
    }
    if (partner.isActive === false) {
      return res.status(404).json({
        success: false,
        message: "Your account is suspended for now",
      });
    }
    if (partner) {
      return res.status(200).json({
        success: true,
        message: "Partner is found",
        data: partner,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking partner existence",
      errorMessage: error.message,
    });
  }
};

// Add money to wallet
// exports.addMoneyToWallet = async (req, res) => {
//   const { id, amount, paymentGateway } = req.body;

//   if (!id || !amount || !paymentGateway) {
//     return res.status(400).json({
//       success: false,
//       message: "Customer ID ,payment Gateway and amount are required",
//     });
//   }

//   try {
//     // Find the customer
//     const customerRecord = await Customer.findOne({
//       _id: id,
//       isActive: true,
//       isDeleted: false,
//     });

//     if (!customerRecord) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Customer not found, may be deleted or deactivated temporarily",
//       });
//     }

//     // Create a transaction record with status "Pending"
//     const transaction = new Transaction({
//       customerId: id,
//       transactionType: "recharge_wallet",
//       amount: Number(amount),
//       paymentGateway: paymentGateway,
//     });

//     // Save the transaction record
//     await transaction.save();

//     res.status(200).json({
//       success: true,
//       message: `₹${amount} recharge initiated for ${customerRecord.name}'s wallet.`,
//       data: { Transaction: transaction },
//     });
//   } catch (error) {
//     console.error("Error adding money to wallet:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error adding money to wallet",
//       errorMessage: error.message,
//     });
//   }
// };

// // Debit money from wallet
// exports.debitMoneyFromWallet = async (req, res) => {
//   const { id, amount } = req.body;

//   if (!id || !amount) {
//     return res.status(400).json({
//       success: false,
//       message: "Customer ID and amount are required",
//     });
//   }

//   try {
//     const customer = await Customer.findOne({
//       _id: id,
//       isActive: true,
//       isDeleted: false,
//     });

//     if (!customerRecord || customer.length === 0 || customer === null) {
//       return res.status(404).json({
//         success: false,
//         message: "Customer not found,may be deleted or deactivated temporarily",
//       });
//     }

//     if (customer.walletBalance < amount) {
//       return res.status(400).json({
//         success: false,
//         message: "Insufficient balance in the wallet",
//       });
//     }

//     customer.walletBalance -= amount;
//     await customer.save();

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

// exports.getWalletBalance = async (req, res) => {
//   try {
//     const { id } = req.body;

//     if (!id) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Customer ID {id} is required" });
//     }
//     const customer = await Customer.findOne({
//       _id: id,
//       isActive: true,
//       isDeleted: false,
//     });

//     if (!customer) {
//       return res.status(404).json({
//         success: false,
//         message: "Customer not found,may be deleted or deactivated temporarily",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Wallet balance fetched successfully",
//       data: { Balance: customer.walletBalance },
//     });
//   } catch (error) {
//     console.error("Error fetching wallet balance:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

// exports.updateTransactionStatus = async (req, res) => {
//   const { transactionId, status, paymentGatewayId } = req.body;

//   if (!transactionId || !status) {
//     return res.status(400).json({
//       success: false,
//       message: "Transaction ID and status are required",
//     });
//   }

//   try {
//     const transactionRecord = await Transaction.findOne({
//       _id: transactionId,
//       isDeleted: false,
//     });

//     if (!transactionRecord) {
//       return res.status(404).json({
//         success: false,
//         message: "Transaction not found with given ID" + transactionId,
//       });
//     }

//     if (transactionRecord.status !== "pending") {
//       return res.status(400).json({
//         success: false,
//         message: `Transaction is already marked as ${transactionRecord.status}`,
//       });
//     }

//     if (status === "completed") {
//       // Update the transaction status to "Completed"
//       transactionRecord.status = "completed";
//       transactionRecord.transactionRefId = paymentGatewayId;
//       await transactionRecord.save();

//       // Add money to the wallet
//       const customerRecord = await Customer.findOne({
//         _id: transactionRecord.customerId,
//         isDeleted: false,
//         isActive: true,
//       });
//       if (!customerRecord) {
//         return res.status(404).json({
//           success: false,
//           message:
//             "Customer not found,may be deleted or deactivated temporarily",
//         });
//       }
//       customerRecord.walletBalance += transactionRecord.amount;
//       await customerRecord.save();

//       return res.status(200).json({
//         success: true,
//         message: `Transaction updated successfully. ₹${transactionRecord.amount} added to wallet.`,
//         data: { Transaction: transactionRecord },
//       });
//     } else if (status === "failed") {
//       // Update the transaction status to "failed"
//       transactionRecord.status = "failed";
//       await transactionRecord.save();

//       return res.status(200).json({
//         success: true,
//         message: "Transaction marked as failed. No money added to wallet.",
//         data: { Transaction: transactionRecord },
//       });
//     } else {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid status value",
//       });
//     }
//   } catch (error) {
//     console.error("Error updating transaction status:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error updating transaction status",
//       errorMessage: error.message,
//     });
//   }
// };

// exports.fetchWalletTransactions = async (req, res) => {
//   const { id } = req.body;

//   if (!id) {
//     return res.status(400).json({
//       success: false,
//       message: "Customer ID is required",
//     });
//   }

//   try {
//     const transactions = await Transaction.find({
//       customerId: id,
//       transactionType: { $in: ["recharge_wallet", "wallet_booking"] },
//       status: "completed",

//       isDeleted: false,
//     }).sort({ createdAt: -1 });

//     if (!transactions || transactions.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No wallet transactions found for this customer",
//       });
//     }


//     res.status(200).json({
//       success: true,
//       message: "Wallet transactions fetched successfully",

//       data: transactions,
//     });
//   } catch (error) {
//     console.error("Error fetching wallet transactions:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching wallet transactions",
//       errorMessage: error.message,
//     });
//   }
// };