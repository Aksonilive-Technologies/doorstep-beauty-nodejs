// need to be approve
const mongoose = require("mongoose");

const AppVersionURLSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      // ref: "",
      required: true,
    },
    userType: {
      type: String,
      enum: ["customer", "partner"],
      required: true,
    },
    appVersion: {
      type: String,
      required: true,
    },
    deviceType: {
      type: String,
      enum: ["android", "ios"],
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
  { timestamps: true }
);

const AppVersionURL = mongoose.model("AppVersion", AppVersionURLSchema);

module.exports = AppVersionURL;
