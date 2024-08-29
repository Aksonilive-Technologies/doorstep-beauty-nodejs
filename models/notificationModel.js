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
    targetAudience: {
      type: String,
      required: true,
    },
    releaseDate: {
      type: String,
      required: true,
    },
    releaseTime: {
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

