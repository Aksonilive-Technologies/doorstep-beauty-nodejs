const mongoose = require("mongoose");

const bookingCancellationFeesSchema = new mongoose.Schema(
  {
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: true,
      },
        customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },
    charges: {
      type: Number,
      required: true,
    },
    status: {
        type: String,
        enum: ["pending", "paid"],
      },
  },
  {
    timestamps: true,
  }
);

const BookingCancellationFees = mongoose.model("BookingCancellationFees", bookingCancellationFeesSchema);

module.exports = BookingCancellationFees;
