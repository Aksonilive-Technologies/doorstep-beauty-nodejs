const mongoose = require("mongoose");

const customersSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      default:
        "https://img.freepik.com/free-vector/flat-style-woman-avatar_90220-2944.jpg?t=st=1723229342~exp=1723232942~hmac=f7ae6821ecd30cc5ed961db3b5494b70a6a3d757ad095a733f38740d141dcaa2&w=740",
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    referralCode: {
      type: String,
      required: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer", 
      required: false, // Optional if not all customers are referred by someone
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
const Customer = mongoose.model("Customer", customersSchema);
module.exports = Customer;
