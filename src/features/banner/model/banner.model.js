import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    redirectUrl: {
      type: String,
      // required: true,
    },
    image: {
      type: String,
      required: true,
    },
    position: {
      type: Number,
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

const Banner = mongoose.model("Banner", bannerSchema);

export default Banner;
