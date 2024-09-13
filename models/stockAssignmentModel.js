const mongoose = require("mongoose");

const stockAssignmentSchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
    },
    stock: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
      // required: true,
    },
    quantity: {
      type: Number,
      // required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

const StockAssignment = mongoose.model(
  "StockAssignment",
  stockAssignmentSchema
);

module.exports = StockAssignment;
