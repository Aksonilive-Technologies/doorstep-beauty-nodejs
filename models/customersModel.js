const mongoose = require("mongoose");

const customersSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
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
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
});
const Customers = mongoose.model("Customers", customersSchema);
module.exports = Customers;
