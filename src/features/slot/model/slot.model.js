import mongoose from "mongoose";

const slotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true,
  },
  clockCycle: {
    type: String,
    enum: ["AM", "PM"],
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update `updatedAt` before saving
slotSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Slot = mongoose.model("Slot", slotSchema);

export default Slot;
