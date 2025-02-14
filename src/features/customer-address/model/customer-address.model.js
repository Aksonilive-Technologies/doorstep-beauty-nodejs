import moongoose from "mongoose";

const customerAddressSchema = new moongoose.Schema(
  {
    customer: {
      type: moongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    address: {
      fullAddress: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      locality: {
        type: String,
        default: "NA",
      },
      landmark: {
        type: String,
        default: "NA",
      },
      state: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        default: "India",
      },
    },
    addressType: {
      type: String,
      required: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
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
const CustomerAddress = moongoose.model(
  "CustomerAddress",
  customerAddressSchema
);
export default CustomerAddress;
