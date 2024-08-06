const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  _id: false,
  houseNumber: {
    type: String,
    required: true,
  },
  buildingName: {
    type: String,
  
  },
  street: {
    type: String,
    required: true,
  },
  landmark: {
    type: String,
  },
  city: {
    type: String,
    required: true,
  },
  district: {
    type: String,
    required: true,
  },
  pincode: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    items: [
      {
        itemType: {
          type: String,
          enum: ["Product", "Service", "Package"],
          required: true,
        },
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    finalPrice: {
      type: Number,
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paymentMethod: {
      type: String,
      enum: ["Credit Card", "Debit Card", "PayPal", "Bank Transfer"],
      default: "Credit Card",
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Completed", "Cancelled"],
      default: "Pending",
    },
    shippingAddress: {
      type: addressSchema,
      required: true,
    },
    billingAddress: {
      type: addressSchema,
      required: true,
    },
    trackingNumber: {
      type: String,
      default: "",
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

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
