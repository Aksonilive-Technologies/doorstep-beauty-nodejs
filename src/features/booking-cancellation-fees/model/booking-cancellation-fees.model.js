import mongoose from "mongoose";

const bookingCancellationFeesSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    userType: {
      type: String,
      enum: ["customer", "partner"],
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

const BookingCancellationFees = mongoose.model(
  "BookingCancellationFees",
  bookingCancellationFeesSchema
);

export default BookingCancellationFees;
