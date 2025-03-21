import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    offerName: {
      type: String,
      trim: true,
    },
    offerDescription: {
      type: String,
      trim: true,
    },
    offerCode: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    offerImage: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/726/726476.png",
    },
    applicableOn: {
      type: String,
      required: true,
      enum: [
        "wallet_booking",
        "package_booking",
        "credit_card",
        "debit_card",
        "upi",
      ],
    },
    offerValidOn: {
      type: Number,
      required: true,
      trim: true,
    },
    offerType: {
      type: String,
      required: [true, "Offer type is required"],
      enum: ["percentage", "product", "amount"],
    },
    offerValue: {
      type: Number,
      required: [true, "Offer value is required"],
    },
    offerValidity: {
      type: String,
      trim: true,
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

const Offer = mongoose.model("Offer", offerSchema);
export default Offer;
