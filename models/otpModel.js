const mongoose = require('mongoose')
const otpSchema = new mongoose.Schema(
  {
    mobile: { 
      type: String, 
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: 'Mobile number must be exactly 10 digits long.',
      }
    },
    email: {
      type: String,
      validate: {
          validator: function(v) {
              return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
          },
          message: props => `${props.value} is not a valid email address!`
      },
      default: ""
      
  },
    otp: { 
      type: String,
      required: true ,
      maxlength:4
    },

    expiresAt: { 
      type: Date, 
      //expires: 60   //60 seconds 
      },
  },
  { 
    timestamps: true 
  },
);

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp;