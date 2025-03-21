import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    transactionType: {
      type: String,
      enum: [
        "recharge_wallet",
        "wallet_booking",
        "gateway_booking",
        "cash_booking",
        "membership_plan_purchase",
        "booking_refund",
        "referral_bonus"
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentGateway: {
      type: String,
      enum: ["cashfree", "razorpay", "wallet", "cash", "system"],
      required: true,
    },
    transactionRefId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
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

export default Transaction;
