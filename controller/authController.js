const otpModel = require("../models/otpModel");
const MasterOTP = require("../models/masterOtpModel");
const catchAsync = require("../utility/catchAsync");
const AppError = require("../utility/appError");
const sendWaMsg = require("../utility/sendWaMsg");
const axios = require('axios');
const fs = require('fs');
const request = require('request');

exports.sendOTP = catchAsync(async (req, res) => {
  let { mobile, signature } = req.query;

  if (!mobile) {
     return res.status(400).json({
      success: "false",
      message: "please enter mobile number",
     })
  }
  // Change signature name
  if (!signature) {
    signature = "doorsbeauty";
  }

  if (!/^\d{10}$/.test(mobile)) {
   return res.status(400).json({
    success: false,
    message: "please enter valid 10 digit mobile number",
   })
  }

  const existingMasterOTP = await MasterOTP.findOne({ mobileNumber: mobile });
  if (existingMasterOTP) {
    console.log("Master number found");

    return res.status(200).json({
      success: true,
      message: "Entered Mobile Number is a Master number",
      data: null,
    });
  }

  console.log("Generating OTP");

  const otp = Math.floor(1000 + Math.random() * 9000);

  // Delete any existing OTP for the mobile number
  const deleteResult = await otpModel.deleteOne({ mobile });
  console.log("Delete result:", deleteResult);

  // Update or create new OTP
  const newVerification = await otpModel.updateOne(
    { mobile: mobile },
    { otp: otp },
    { upsert: true }  // Use upsert to create if not exists
  );

  console.log("Update result:", newVerification);

  if (!newVerification) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errorMessage : "Error sending OTP"
    })
  }

  mobile = Number(mobile);

  try {
    console.log("Sending OTP...");
    // Implement actual OTP sending logic here
    const response = await sendWaMsg(mobile,otp)
    if(!response){
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        errorMessage : "Error sending OTP through what's app"
      })
    }

    console.log("OTP sent successfully");
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errorMessage : error.message
    })
  }

  return res.status(200).json({
    success: true,
    message: "OTP sent successfully",
    data: null,
  });
});


exports.verifyOTP = catchAsync(async (req, res) => {
  const { mobile, otp } = req.query;

  if (!mobile || !otp) {
   return res.status(400).json({
    success: false,
    message: "please enter mobile number and otp",
   })
  }

  if (!/^\d{10}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: "please enter valid 10 digit mobile number",
    })
  }

  // Check if the mobile number exists in the Master OTP table
  const masterOTP = await MasterOTP.findOne({ mobileNumber: mobile });

  if (masterOTP) {
    if (masterOTP.otp === otp) {
      return res.status(200).json({
       success: true,
        message: "OTP verified successfully",
        data: null,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Entered master otp is wrong, please try again",
      })
    }
  } else {
    const verification = await otpModel.findOne({ mobile });

    if (!verification) {
      return res.status(400).json({
        success: "false",
        message: "otp not found, please send otp",
      })
    }

    if (verification.otp != otp) {
      return res.status(400).json({
        success: false,
        message: "Entered otp is wrong, please try again",
      })
    }
    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: null,
    });
  }
});

exports.registerMasterOTP = catchAsync(async (req, res) => {
  const { mobileNumber, otp } = req.query;
  // Check if mobileNumber and otp are provided
  if (!mobileNumber || !otp) {
    throw new AppError("Both mobileNumber and otp are required.", 400);
  }
  const verification = await MasterOTP.findOne(
    { mobileNumber: mobileNumber },
    { otp: otp }
  );
  if (verification) {
    throw new AppError("Master Otp already exists", 400);
  }
  const m = await MasterOTP.create({ mobileNumber: mobileNumber, otp: otp });
  return res.status(200).json({
    success: true,
    code: 200,
    message: "OTP created successfully",
  });
});

exports.getAllMasterOTP = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  let query = {}; // Initial empty query object

  // Check if search parameter is provided
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, "i"); // Create case-insensitive regex
    query = { mobileNumber: searchRegex }; // Search against the phoneNumber field
  }

  const count = await MasterOTP.countDocuments(query);
  const totalPages = Math.ceil(count / limit);

  const masterotp = await MasterOTP.find(query).skip(skip).limit(limit);

  if (masterotp.length === 0) {
    throw new AppError("No Master OTP found matching the search criteria", 404);
  }

  res.status(200).json({
    success: true,
    code: 200,
    message: "Master OTPs found successfully",
    data: masterotp,
    pagination: {
      page,
      limit,
      totalPages,
      totalItems: count,
    },
  });
});

exports.updateMasterOTP = catchAsync(async (req, res) => {
    const { mobileNumber, otp } = req.query;
    if (!mobileNumber || !otp) {
      throw new AppError("Both mobileNumber and otp are required.",404);
    }
    const verification = await MasterOTP.findOneAndUpdate(
      { mobileNumber: mobileNumber },
      { otp: otp }
    );
    if (!verification) {
      throw new AppError("Mobile Number is not Registered",400);
    }
    res.status(200).json({
      success: true,
      code: "200",
      message: "master Otp is updated succesfully ",
      data: null,
    });
});
exports.deleteMasterOTP = catchAsync(async (req, res) => {
    const { mobileNumber } = req.query;
    if (!mobileNumber) {
      throw new AppError("Enter mobile number",404);
    }
    const del = await MasterOTP.findOneAndDelete({
      mobileNumber: mobileNumber,
    });
    if (!del) {
      throw new AppError("Mobile Number not found in master Table",404);
    }
    return res.status(200).json({
      success: true,
      code: "200",
      message: "master Otp is Deleted succesfully ",
      data: null,
    });
});