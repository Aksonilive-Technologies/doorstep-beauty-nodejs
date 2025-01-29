const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema(
  {
    image: {
      type: String,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    body: {
      type: String,
      required: true,
      maxlength: 500,
    },
    // need to approve
    targetAudience: {
      type: [String], // Changed to an array of strings
    },
    audienceType: {
      type: String,
      required: true,
      enum: ["customer", "partner"],
    },
    notificationDate: {
      type: String,
      required: true,
    },
    notificationTime: {
      type: String,
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
  },
  {
    timestamps: true,
  }
);
const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
