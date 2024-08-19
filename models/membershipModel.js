// has to be approve
const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
  {
    tenure: {
      type: Number,
      required: true,
    },
    membershipType: {
      type: String,
      required: true,
      enum: ["month", "weekly", "year"],
    },
    price: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    discountedPrice: {
      type: Number,
      min: [0, "Discounted price cannot be negative"],
    },
    discountedPercentage: {
      type: Number,
      min: [0, "Discounted percentage cannot be negative"],
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
    timestamps: true,
  }
);

const Membership = mongoose.model("Membership", membershipSchema);

module.exports = Membership;


