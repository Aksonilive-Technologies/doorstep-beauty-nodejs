const { default: mongoose, Schema } = require("mongoose");

const bannerSchema = new Schema(
  {
    redirectUrl: {
      type: String,
      required: true,
    },
    bannerImage: {
      type: String,
      // default:
      //   "https://www.google.com/url?sa=i&url=https%3A%2F%2Fin.pinterest.com%2Fpin%2Fbeauty-salon-social-media-banner-design--288511919889737115%2F&psig=AOvVaw14LPv5ZLPQIkDhFS-jjlPK&ust=1723301475663000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCJD-rLSU6IcDFQAAAAAdAAAAABAE",
      // required: true,
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
