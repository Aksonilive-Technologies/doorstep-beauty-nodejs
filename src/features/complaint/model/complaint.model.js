import mongoose from "mongoose";

const customerComplaintSchema = new mongoose.Schema(
  {
    // Index added to optimize querying by customerId
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    complaintCategory: {
      type: String,
      required: [true, "Complaint category is required"]
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    // resolutionComment
    closingRemark: {
      type: String,
      trim: true,
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

customerComplaintSchema.pre("save", function (next) {
  if (this.description) {
    this.description = this.description.trim();
  }
  next();
});

const Complaint = mongoose.model("Complaint", customerComplaintSchema);

export default Complaint;
