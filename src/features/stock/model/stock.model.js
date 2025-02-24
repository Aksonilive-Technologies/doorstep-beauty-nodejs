import mongoose from "mongoose";
const { Schema } = mongoose;

const stockSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      // required: true,
      trim: true,
    },
    size: {
      type: String,
      required: true,
      trim: true,
    },
    entryStock: {
      type: Number,
      required: true,
      min: 0,
    },
    currentStock: {
      type: Number,
      required: true,
      min: 0,
    },
    mrp: {
      type: Number,
      // required: true,
      min: 0,
    },
    purchasingRate: {
      type: Number,
      // required: true,
      min: 0,
    },
    position: {
      type: Number,
      required: true,
    },
    image: {
      type: [String],
      required: true,
    },
    barcodeNumber: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Stock = mongoose.model("Stock", stockSchema);

export default Stock;
