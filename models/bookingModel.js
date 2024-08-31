const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    product: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    productTool: [
      {
        productTool: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ProductTool",
        }
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    finalPrice: {
      type: Number,
      required: true,
    },
    partner: [
     { 
      _id: false, 
      partner : {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner"
                 },
       rating : {
         type: Number,
         default: 0
       }
      ,}
    ],
    discountType: {
      type: String,
      enum: ["percentage", "flat_amount","product"],
      default: "flat_amount",
    },
    discountValue: {
      type: Number,
      default: 0,
    },
    offerType: {
      type: String,
      enum: ["membership", "offer"],
    },
    offerRefId: {
      type: mongoose.Schema.Types.ObjectId,
      refpath : "offerType"
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed","failed","refunded","cancelled"],
      default: "pending",
    },
    customerAddress: {
      type:String,
      default : "NA"
    },
     rating : {
       type: Number,
       default: 0
     },
     serviceStatus : {
       type: String,
       enum : ["ongoing", "completed", "cancelled","scheduled","pending"],
       default : "pending"
     },
     paymentStatus : {
       type: String,
       enum : ["pending", "completed","failed"],
       default : "pending"
     },
     scheduleFor : {
      date:{
        type: Date,
      },
      time:{
        type: String
      },
      format : {
        type: String,
        enum:["AM","PM"]
      }
     },
     startTime : {
       type: Date
     },
     endTime : {
       type: Date
     },
     duration : {
       type: String
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

const Booking = mongoose.model("Booking", BookingSchema);

module.exports = Booking;
