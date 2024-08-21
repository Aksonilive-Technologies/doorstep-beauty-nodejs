const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    membership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Membership",
      required: true,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    expiryDate: {
      type: Date,
      default: null, // Will be calculated after the document is created
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

// Helper function to calculate tenure in milliseconds
function calculateTenureInMs(tenure, tenureType) {
  switch (tenureType) {
    case "month":
      return tenure * 30 * 24 * 60 * 60 * 1000; // Convert months to milliseconds
    case "week":
      return tenure * 7 * 24 * 60 * 60 * 1000; // Convert weeks to milliseconds
    case "year":
      return tenure * 365 * 24 * 60 * 60 * 1000; // Convert years to milliseconds
    default:
      return 0;
  }
}

// Middleware to calculate expiryDate after the document is created
planSchema.pre("save", async function (next) {
  if (!this.expiryDate) {
    const membership = await mongoose
      .model("Membership")
      .findById(this.membership);
    if (membership) {
      const tenureInMs = calculateTenureInMs(
        membership.tenure,
        membership.tenureType
      );
      this.expiryDate = new Date(this.createdAt.getTime() + tenureInMs);
    }
  }
  next();
});

// Middleware to check if the plan has expired and set isValid and isActive
planSchema.post("save", function (doc, next) {
  if (doc.expiryDate && doc.expiryDate < Date.now()) {
    doc.isValid = false;
    // doc.isActive = false;
    doc.save(); // Ensure that the changes are saved after middleware runs
  }
  next();
});

const Plan = mongoose.model("Plan", planSchema);

module.exports = Plan;
