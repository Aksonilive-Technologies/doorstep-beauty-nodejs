import mongoose from "mongoose";

const StockBookingSchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
    },
    product: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Stock",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
    },
    deliveryAddress: {
      type: String,
      default: "NA",
    },
    status: {
      type: String,
      enum: [
        "booked",
        "processing",
        "delivered",
        "failed",
        "returned",
        "refunded",
        "cancelled",
      ],
      default: "booked",
    },
    statusUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PartnerTransaction",
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

export default StockBooking;
