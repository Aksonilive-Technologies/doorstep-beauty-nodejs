const mongoose = require("mongoose");

const customersSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      default:
        "https://res.cloudinary.com/da54w0hbc/image/upload/v1738085572/spare_files/1738085570964_Singup%20girl%20icon.png",
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
      required: false,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer", 
      required: false, // Optional if not all customers are referred by someone
    },
    walletBalance: {
      type: Number,
      default: 0,
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
