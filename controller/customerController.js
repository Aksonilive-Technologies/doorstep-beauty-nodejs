const Customer = require("../models/customerModel.js");
const jwt = require("jsonwebtoken");
const generateCode = require("../helper/generateCode.js");
const generateRandomCode = require("../helper/generateCode.js");
const { cloudinary } = require("../config/cloudinary");
const Transaction = require("../models/transactionModel.js");
const Plan = require("../models/customerMembershipPlan.js");
const Membership = require("../models/membershipModel.js");
//Create Register
const validateUserInput = (name, email, mobile) => {
  if (!name) return "Please fill the name field";
  if (!email) return "Please fill the email field";
  if (!mobile) return "Please fill the mobile field";
  // if (!address) return "Please fill the address field";

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return "Invalid email";

  return null;
};

exports.register = async (req, res) => {
  const { name, email, mobile } = req.body;

  // Validate user input
  const validationError = validateUserInput(name, email, mobile);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    // Check if user already exists
    const existingUser = await Customer.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    // Check if mobile number already exists
    const existingMobile = await Customer.findOne({ mobile: mobile });
    if (existingMobile) {
      return res
        .status(400)
        .json({ success: false, message: "Mobile number already registered" });
    }

    // Upload the image to Cloudinary if present
    let imageUrl = undefined;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "customers",
        public_id: `${Date.now()}_${name}`,
        overwrite: true,
      });
      imageUrl = result.secure_url;
    }

    // Generate a referral code
    const referralCode = generateRandomCode(6);

    // Create a new user
    const user = new Customer({
      name,
      email,
      mobile: mobile,
      referralCode: referralCode,
      image: imageUrl || undefined,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Error creating user",
      errorMessage: error.message,
    });
  }
};

// exports.getAllCustomers = async (req, res) => {
//   try {
//     const customers = await Customer.find().select("-__v");
//     res.status(200).json({
//       success: "true",
//       message: "All customers are fetched successfully",
//       data: customers,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching customers",
//       errorMessage: error.message,
//     });
//   }
// };

exports.getAllCustomers = async (req, res) => {
  try {
    const { page = 1 } = req.query; // Get the page number from the query, default to 1
    const limit = 10; // Limit to 10 customers per page
    const skip = (page - 1) * limit; // Calculate how many documents to skip

    const customers = await Customer.find()
      .select("-__v")
      .skip(skip)
      .limit(limit);

    const totalCustomers = await Customer.countDocuments(); // Get the total number of customers
    const totalPages = Math.ceil(totalCustomers / limit); // Calculate total pages

    res.status(200).json({
      success: "true",
      message: "All customers are fetched successfully",
      data: customers,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching customers",
      errorMessage: error.message,
    });
  }
};

//update customer

exports.updateCustomer = async (req, res) => {
  const { id, name, email, mobile } = req.body;
  const file = req.file; // Accessing the file from req.file

  console.log("Request received with body:", req.body);
  console.log("File received:", file);

  try {
    // Validate required fields
    if (!id) {
      console.log("Customer ID is missing");
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    // Fetch the current customer details
    console.log("Fetching customer with ID:", id);
    const customer = await Customer.findById(id);

    if (!customer) {
      console.log("Customer not found for ID:", id);
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check if the customer account is suspended or deactivated
    if (customer.isActive === false) {
      console.log("Customer account is suspended:", id);
      return res.status(403).json({
        success: false,
        message: "Your account is suspended for now",
      });
    }

    if (customer.isDeleted === true) {
      console.log("Customer account is deactivated:", id);
      return res.status(403).json({
        success: false,
        message: "Your account is deactivated, please contact the support team",
      });
    }

    // Create an object to hold the fields to update
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (mobile) updateFields.mobile = mobile;

    // Upload the image to Cloudinary if a file is present
    if (file) {
      console.log("Uploading file to Cloudinary:", file.filename);
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "customers",
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

    // Update the customer details
    console.log("Updating customer details for ID:", id);
    const customerUpdated = await Customer.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!customerUpdated) {
      console.log("Failed to update customer:", id);
      return res.status(500).json({
        success: false,
        message: "Error updating customer",
      });
    }

    console.log("Customer updated successfully:", customerUpdated);
    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customerUpdated,
    });
  } catch (error) {
    console.error("Error updating customer:", error.message);
    res.status(500).json({
      success: false,
      message: "Error updating customer",
      errorMessage: error.message,
    });
  }
};

//delete customer
exports.deleteCustomer = async (req, res) => {
  const { id } = req.query;
  try {
    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (customer.isDeleted) {
      return res.status(404).json({
        success: false,
        message:
          "Your account is already deleted. Please contact the support team for assistance.",
      });
    }

    // if (!customer.isActive) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Your account is currently inactive.",
    //   });
    // }

    const customerDeleted = await Customer.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!customerDeleted) {
      return res.status(500).json({
        success: false,
        message: "Error deleting customer",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Your account has been successfully deleted.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the customer.",
      errorMessage: error.message,
    });
  }
};

//change status of deleted customer
exports.changeStatusDeletedCustomer = async (req, res) => {
  const { id } = req.query;
  try {
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (!customer.isActive) {
      customer.isActive = true;
      await customer.save();
      return res.status(200).json({
        success: true,
        message: "Your account is activated now",
      });
    } else {
      customer.isActive = false;
      await customer.save();
      return res.status(200).json({
        success: true,
        message:
          "Your account has been temporarily deactivated. Please contact the support team.",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while changing the status of the customer.",
      errorMessage: error.message,
    });
  }
};

exports.customerById = async (req, res) => {
  const { id } = req.query;
  try {
    if (!id) {
      return res.status(404).json({
        success: false,
        message: "Customer ID is required.",
      });
    }
    const customer = await Customer.findById(id)
      .select("-password")
      .select("-__v");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (customer.isDeleted === true) {
      return res.status(404).json({
        success: false,
        message: "Your account is deactivated, please contact the support team",
      });
    }
    if (customer.isActive === false) {
      return res.status(404).json({
        success: false,
        message: "Your account is suspended for now",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer fetched successfully",
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching customer",
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
    const customer = await Customer.findOne({ mobile: mobile })
      .select("-password")
      .select("-__v");
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer with mobile number " + mobile + " not found",
      });
    }
    if (customer.isDeleted === true) {
      return res.status(404).json({
        success: false,
        message: "Your account is deactivated, please contact the support team",
      });
    }
    if (customer.isActive === false) {
      return res.status(404).json({
        success: false,
        message: "Your account is suspended for now",
      });
    }
    if (customer) {
      return res.status(200).json({
        success: true,
        message: "Customer is found",
        data: customer,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking customer existence",
      errorMessage: error.message,
    });
  }
};

// Add money to wallet
exports.addMoneyToWallet = async (req, res) => {
  const { id, amount, paymentGateway } = req.body;

  if (!id || !amount || !paymentGateway) {
    return res.status(400).json({
      success: false,
      message: "Customer ID ,payment Gateway and amount are required",
    });
  }

  try {
    // Find the customer
    const customerRecord = await Customer.findOne({
      _id: id,
      isActive: true,
      isDeleted: false,
    });

    if (!customerRecord) {
      return res.status(404).json({
        success: false,
        message:
          "Customer not found, may be deleted or deactivated temporarily",
      });
    }

    // Create a transaction record with status "Pending"
    const transaction = new Transaction({
      customerId: id,
      transactionType: "recharge_wallet",
      amount: Number(amount),
      paymentGateway: paymentGateway,
    });

    // Save the transaction record
    await transaction.save();

    res.status(200).json({
      success: true,
      message: `₹${amount} recharge initiated for ${customerRecord.name}'s wallet.`,
      data: { Transaction: transaction },
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

// Debit money from wallet
exports.debitMoneyFromWallet = async (req, res) => {
  const { id, amount } = req.body;

  if (!id || !amount) {
    return res.status(400).json({
      success: false,
      message: "Customer ID and amount are required",
    });
  }

  try {
    const customer = await Customer.findOne({
      _id: id,
      isActive: true,
      isDeleted: false,
    });

    if (!customerRecord || customer.length === 0 || customer === null) {
      return res.status(404).json({
        success: false,
        message: "Customer not found,may be deleted or deactivated temporarily",
      });
    }

    if (customer.walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance in the wallet",
      });
    }

    customer.walletBalance -= amount;
    await customer.save();

    res.status(200).json({
      success: true,
      message: `₹${amount} debited from wallet successfully`,
    });
  } catch (error) {
    console.error("Error debiting money from wallet:", error);
    res.status(500).json({
      success: false,
      message: "Error debiting money from wallet",
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
        .json({ success: false, message: "Customer ID {id} is required" });
    }
    const customer = await Customer.findOne({
      _id: id,
      isActive: true,
      isDeleted: false,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found,may be deleted or deactivated temporarily",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Wallet balance fetched successfully",
      data: { Balance: customer.walletBalance },
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
    const transactionRecord = await Transaction.findOne({
      _id: transactionId,
      isDeleted: false,
    });

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

      // Add money to the wallet
      const customerRecord = await Customer.findOne({
        _id: transactionRecord.customerId,
        isDeleted: false,
        isActive: true,
      });
      if (!customerRecord) {
        return res.status(404).json({
          success: false,
          message:
            "Customer not found,may be deleted or deactivated temporarily",
        });
      }
      customerRecord.walletBalance += transactionRecord.amount;
      await customerRecord.save();

      return res.status(200).json({
        success: true,
        message: `Transaction updated successfully. ₹${transactionRecord.amount} added to wallet.`,
        data: { Transaction: transactionRecord },
      });
    } else if (status === "failed") {
      // Update the transaction status to "failed"
      transactionRecord.status = "failed";
      await transactionRecord.save();

      return res.status(200).json({
        success: true,
        message: "Transaction marked as failed. No money added to wallet.",
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

exports.fetchWalletTransactions = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Customer ID is required",
    });
  }

  try {
    const transactions = await Transaction.find({
      customerId: id,
      transactionType: { $in: ["recharge_wallet", "wallet_booking"] },
      status: "completed",
      isDeleted: false,
    }).sort({ createdAt: -1 });

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No wallet transactions found for this customer",
      });
    }

    // const creditTransactions = transactions.filter(
    //   (transaction) => transaction.transactionType === "recharge_wallet"
    // );

    // const debitTransactions = transactions.filter(
    //   (transaction) => transaction.transactionType === "wallet_booking"
    // );

    res.status(200).json({
      success: true,
      message: "Wallet transactions fetched successfully",
      // data: {
      //   credit: creditTransactions,
      //   debit: debitTransactions,
      // },
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

exports.updateMembershipTransactionStatus = async (req, res) => {
  const { transactionId, status, paymentGatewayId, membershipId } = req.body;

  if (!transactionId || !status) {
    return res.status(400).json({
      success: false,
      message: "Transaction ID and status are required",
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

      const plan = new Plan({
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
