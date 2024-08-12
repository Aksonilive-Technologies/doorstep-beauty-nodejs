const { default: mongoose, Schema } = require("mongoose");

const bannerSchema = new Schema(
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

module.exports = Banner;
