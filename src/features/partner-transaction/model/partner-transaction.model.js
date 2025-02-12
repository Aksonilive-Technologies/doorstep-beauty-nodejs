import mongoose from "mongoose";

const partnerTransactionSchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
    },
    transactionType: {
      type: String,
      enum: [
        "recharge_wallet",
        "booking_confirmation",
        "booking_cancellation",
        "booking_refund",
        "stock_booking",
        "stock_wallet_booking",
        "stock_booking_refund",
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentGateway: {
      type: String,
      enum: ["cashfree", "razorpay", "wallet", "cash"],
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

const PartnerTransaction = mongoose.model(
  "PartnerTransaction",
  partnerTransactionSchema
);

export default PartnerTransaction;
