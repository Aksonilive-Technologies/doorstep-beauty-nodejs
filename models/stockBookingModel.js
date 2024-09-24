const mongoose = require("mongoose");

const StockBookingSchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: true
    },
    stockItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
      required: true
    },
    deliveryAddress: {
      type: String,
      default: "NA",
    },
    quantity: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
        "cancelled",
      ],
      default: "pending",
    },
    paymentMode: {
      type: String,
      // required: true
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const StockBooking = mongoose.model("StockBooking", StockBookingSchema);

module.exports = StockBooking;
