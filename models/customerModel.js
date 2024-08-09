const mongoose = require("mongoose");

const customersSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      default:
        "www.freepik.com/free-vector/flat-style-woman-avatar_233878897.htm#fromView=search&page=1&position=5&uuid=46a9df45-cd24-4488-99c8-6f1676c22924",
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
    address: {
      type: String,
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
