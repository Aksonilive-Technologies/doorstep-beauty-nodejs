const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    transactionType: {
      type: String,
      enum: ["Recharge Wallet", "Book Product using Wallet", "Book product using payment gateway"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentGateway: {
      type: String,
      enum: ["Cashfree", "Razorpay", "Wallet"],
      required: true,
    },
    transactionRefId: {
      type: String,
      default: "NA"
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Pending",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
