import mongoose from "mongoose";

const serviceablePincodeSchema = new mongoose.Schema(
  {
    pincode: {
      type: Number,
      required: true,
      minlength: 6,
      maxlength: 6,
    },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
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
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const ServiceablePincode = mongoose.model(
  "ServiceablePincode",
  serviceablePincodeSchema
);
export default ServiceablePincode;
