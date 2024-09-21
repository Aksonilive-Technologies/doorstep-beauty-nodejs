const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    productOption: {
      type: mongoose.Schema.Types.ObjectId,
    },
    quantity: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const CartItem = mongoose.model("CartItem", CartItemSchema);

module.exports = CartItem;
