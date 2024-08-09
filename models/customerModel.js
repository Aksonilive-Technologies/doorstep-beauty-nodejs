const mongoose = require("mongoose");

const customersSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      default:
        "https://www.google.com/imgres?imgurl=https%3A%2F%2Flookaside.fbsbx.com%2Flookaside%2Fcrawler%2Fmedia%2F%3Fmedia_id%3D100064041720159&tbnid=CatNt3FPfftJqM&vet=12ahUKEwj-lJ7_0OWHAxVNRCoJHesUIhMQMygEegQIARBd..i&imgrefurl=https%3A%2F%2Fm.facebook.com%2Fp%2FBeauty-Parlour-And-Saloon-Product-Sale-And-Repear-100064041720159%2F&docid=Hj9Se5mRLD346M&w=672&h=456&q=saloon%20product&ved=2ahUKEwj-lJ7_0OWHAxVNRCoJHesUIhMQMygEegQIARBd",
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    refferalCode: {
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
const Customer = mongoose.model("Customer", customersSchema);
module.exports = Customer;
