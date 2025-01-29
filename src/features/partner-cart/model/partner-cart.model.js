const mongoose = require("mongoose");

const PartnerCartSchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
    },
    stockItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

const PartnerCart = mongoose.model("PartnerCart", PartnerCartSchema);

module.exports = PartnerCart;
