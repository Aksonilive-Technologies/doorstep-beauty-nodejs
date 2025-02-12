// need to be approve
import mongoose from "mongoose";

const firebaseTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      // ref: "Customer",
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
      enum: ["customer", "partner"],
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

const FirebaseToken = mongoose.model("FirebaseToken", firebaseTokenSchema);

export default FirebaseToken;
