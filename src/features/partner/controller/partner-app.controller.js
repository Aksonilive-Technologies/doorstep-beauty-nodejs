const Partner = require("../model/partner.model.js");
const jwt = require("jsonwebtoken");
const generateCode = require("../../../../helper/generateCode.js");
const generateRandomCode = require("../../../../helper/generateCode.js");
const { cloudinary } = require("../../../../config/cloudinary");
const Transaction = require("../../transaction/model/transaction.model.js");
const ServicablePincode = require("../../servicable-pincode/model/servicable-pincode.model.js");

const PartnerTransaction = require("../../partner-transaction/model/partner-transaction.model.js");
const { createOrder } = require("../../../../helper/razorpayHelper.js");

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
        message: "Partner not found, may be deleted or deactivated temporarily",
      });
    }

    const orderId = await createOrder(Number(amount) * 100);

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
      data: { Transaction: partnerTransaction, OrderId: orderId },
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
    const partner = await Partner.findById(id).select("-__v");

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
    const partner = await Partner.findOne({ phone: mobile }).select("-__v");
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

exports.updatePartner = async (req, res) => {
  const { id } = req.body;
  const file = req.file; // Accessing the file from req.file

  console.log("Request received with body:", req.body);
  console.log("File received:", file);

  try {
    // Validate required fields
    if (!id) {
      console.log("Partner ID is missing");
      return res.status(400).json({
        success: false,
        message: "Partner ID is required",
      });
    }

    // Fetch the current partner details
    console.log("Fetching partner with ID:", id);
    const partner = await Partner.findById(id);

    if (!partner) {
      console.log("Partner not found for ID:", id);
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    // Check if the partner account is suspended or deactivated
    if (partner.isActive === false) {
      console.log("Partner account is suspended:", id);
      return res.status(403).json({
        success: false,
        message: "Your account is suspended for now",
      });
    }

    if (partner.isDeleted === true) {
      console.log("Partner account is deactivated:", id);
      return res.status(403).json({
        success: false,
        message: "Your account is deactivated, please contact the support team",
      });
    }

    // Create an object to hold the fields to update
    const updateFields = {};
    // if (name) updateFields.name = name;
    // if (email) updateFields.email = email;
    // if (mobile) updateFields.mobile = mobile;

    // Upload the image to Cloudinary if a file is present
    if (file) {
      console.log("Uploading file to Cloudinary:", file.filename);
      try {
      const baseFolder = process.env.CLOUDINARY_BASE_FOLDER || "";

        const result = await cloudinary.uploader.upload(file.path, {
          folder: baseFolder + "partners",
          public_id: `${Date.now()}_${file.originalname.split(".")[0]}`,
          overwrite: true,
        });
        console.log("Image uploaded successfully:", result.secure_url);
        updateFields.image = result.secure_url; // Add the image URL to the updateFields object
      } catch (error) {
        console.error("Error uploading image to Cloudinary:", error.message);
        return res.status(500).json({
          success: false,
          message: "Error uploading image",
          errorMessage: error.message,
        });
      }
    }

    // Update the partner details
    console.log("Updating partner details for ID:", id);
    const partnerUpdated = await Partner.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!partnerUpdated) {
      console.log("Failed to update partner:", id);
      return res.status(500).json({
        success: false,
        message: "Error updating partner",
      });
    }

    console.log("Partner updated successfully:", partnerUpdated);
    res.status(200).json({
      success: true,
      message: "Partner updated successfully",
      data: partnerUpdated,
    });
  } catch (error) {
    console.error("Error updating partner:", error.message);
    res.status(500).json({
      success: false,
      message: "Error updating partner",
      errorMessage: error.message,
    });
  }
};
