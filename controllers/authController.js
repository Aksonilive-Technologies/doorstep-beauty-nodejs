const otpModel = require("./../model/otpModel");
const MasterOTP = require("../model/masterOtpModel");
const catchAsync = require("../utility/catchAsync");
const AppError = require("../utility/appError");




exports.sendOTP = catchAsync(async (req, res) => {
  let { mobile, signature } = req.query;
  if (!mobile) {
    throw new AppError("Please Provide Your Mobile Number", 400);
  }
  if (!signature) {
    signature = "mitra-fintech";
  }

  if (!/^\d{10}$/.test(mobile)) {
    throw new AppError(
      "Invalid mobile number format. It must be exactly 10 digits.",
      400
    );
  }
  const existingMasterOTP = await MasterOTP.findOne({ mobileNumber: mobile });
  if (existingMasterOTP) {
    try {
      response = await fetch(
        // https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.SMS_API_KEY}&route=dlt&sender_id=BURATA&message=156711&variables_values=${otp}%7C${signature}%7C&flash=0&numbers=${mobile}
        `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.SMS_API_KEY}&route=dlt&sender_id=MTRAFN&message=165737&variables_values=${existingMasterOTP.otp}%7C${signature}%7C&flash=0&numbers=${mobile}`
      );
  
      // await sendOTPWhatsAppGupshup(mobile, otp);
      await sendWaMsg([otp],"login_otp_v2",mobile)
    } catch (error) {
      console.log(error);
    }
    return res.status(200).json({
      status: "success",
      code: 200,
      message: "Entered Mobile Number is a Master number",
      data: null,
    });
  }
  
  const otp = Math.floor(1000 + Math.random() * 9000);
  await otpModel.deleteOne({mobile})

  const newVerification = await otpModel.create({
    mobile,
    otp,
  });

  if (!newVerification) {
    throw new AppError("Error saving mobile number and OTP", 400);
  }
  mobile = Number(mobile);
  let response;
  // Send OTP via an SMS service (e.g., Fast2SMS)
  try {
    response = await fetch(
      // https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.SMS_API_KEY}&route=dlt&sender_id=BURATA&message=156711&variables_values=${otp}%7C${signature}%7C&flash=0&numbers=${mobile}
      `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.SMS_API_KEY}&route=dlt&sender_id=MTRAFN&message=165737&variables_values=${otp}%7C${signature}%7C&flash=0&numbers=${mobile}`
    );

    // await sendOTPWhatsAppGupshup(mobile, otp);
    await sendWaMsg([otp],"login_otp_v2",mobile)
  } catch (error) {
    console.log(error);
  }
  const data = await response.json();
  console.log(data);
  if (data.return) {
    return res.status(200).json({
      status: "success",
      code: 200,
      message: "OTP sent successfully",
      data: null,
    });
  } else {
    throw new AppError("Error sending OTP", 400);
  }
});

exports.verifyOTP = catchAsync(async (req, res) => {
  const { mobile, otp } = req.query;

  if (!mobile || !otp) {
    throw new AppError("Mobile number or OTP not found", 400);
  }

  if (!/^\d{10}$/.test(mobile)) {
    throw new AppError(
      "Invalid mobile number format. It must be exactly 10 digits.",
      400
    );
  }

  // Check if the mobile number exists in the Master OTP table
  const masterOTP = await MasterOTP.findOne({ mobileNumber: mobile });

  if (masterOTP) {
    if (masterOTP.otp === otp) {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "OTP verified successfully",
        data: null,
      });
    } else {
      throw new AppError(
        "Invalid OTP. Please use the correct Master OTP.",
        400
      );
    }
  } else {
    const verification = await otpModel.findOne({ mobile });

    if (!verification) {
      throw new AppError("OTP not found. You can resend the OTP.", 400);
    }

    if (verification.otp !== otp) {
      throw new AppError("Invalid OTP", 400);
    }
    return res.status(200).json({
      status: "success",
      code: 200,
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
    status: "success",
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
    status: "success",
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
      status: "success",
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
      status: "success",
      code: "200",
      message: "master Otp is Deleted succesfully ",
      data: null,
    });
});

async function sendOTPWhatsAppGupshup(mobileNumber, otp) {
  try {
    const endpoint = 'https://api.gupshup.io/wa/api/v1/template/msg';
    const apiKey = 'y6augsnlvufcalxps2grvxgbmxvdjgo7';
    const businessNumber = '12345293827';
    const templateId = '900020ae-6fee-41d7-abdf-7f230d27f524';
    const countryCode = '91'; // Country code to attach to the phone number
    const MobileNo = countryCode + mobileNumber; 

    const body = new URLSearchParams({
      'channel': 'whatsapp',
      'source': businessNumber,
      'destination': MobileNo,
      'src.name': 'ChatWeaver',
      'template': JSON.stringify({
        "id": templateId,
        "params": ["Mitra Fintech", otp]
      })
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apikey': apiKey,
        'Cache-Control': 'no-cache'
      },
      body
    });

    console.log('Response:', response);

    if (response.ok) {
      return true;
    } else {
      throw new Error('Error sending OTP via WhatsApp');
    }
  } catch (error) {
    console.error('Error sending OTP via WhatsApp:', error);
    return false;
  }
}

exports.sendOTPWhatsAppGupshup = sendOTPWhatsAppGupshup;