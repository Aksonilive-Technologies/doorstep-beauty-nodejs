const { default: mongoose } = require("mongoose");

const customerComplaintSchema = new mongoose.Schema(
  {
    // 
    // customerId rakhna hai
    // name: {
    //   type: String,
    //   required: true,
    // },
    // email: {
    //   type: String,
    //   required: true,
    //   lowercase: true,
    // },
    // phone: {
    //   type: String,
    //   required: true,
    // },
    // complaintId: {
    //   type: String,
    //   required: true,
    //   unique: true,
    // },
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
    //change the name of resolution
    resolutionComment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);
const Complaint = mongoose.model("Complaint", customerComplaintSchema);

module.exports = Complaint;
