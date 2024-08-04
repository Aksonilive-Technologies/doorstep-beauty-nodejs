const mongoose = require('mongoose');

const masterOTPSchema = new mongoose.Schema(
  {
    mobileNumber: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: 'Mobile number must be exactly 10 digits long.',
      },
    },
    otp: {
      type: String,
      required: true,
      maxlength:4
    },
  },
  { 
    timestamps: true 
  },
);

const MasterOTP = mongoose.model('MasterOTP', masterOTPSchema);

module.exports = MasterOTP;
