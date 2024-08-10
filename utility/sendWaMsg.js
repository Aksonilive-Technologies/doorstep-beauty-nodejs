const axios = require("axios");
const AppError = require("./appError");
const catchAsync = require("./catchAsync");

async function sendOtp(phoneNumber, otp) {
    const data = {
        countryCode: "+91", // Assuming it's an Indian number, modify as per the requirement
        phoneNumber: phoneNumber,
        callbackData: "OTP Request",
        type: "Template",
        template: {
            name: "send_otp_v1", // Replace with the actual template name for OTP
            languageCode: "en",
            bodyValues: [otp],
            buttonValues: {
                "0": [otp],
            }
        },
    };

    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://api.interakt.ai/v1/public/message/',
        headers: {
            'Content-Type': 'application/json',
            "Authorization": "Basic " + process.env.INTERAKT_API_KEY, // Replace with your actual API key
        },
        data: data,
    };

    try {
        console.log("Sending OTP...");
        const response = await axios(config);
        console.log("OTP sent successfully:", JSON.stringify(response.data));
        return response.data; // Resolve with the response data
    } catch (error) {
        console.error("Error sending OTP:", error.response ? error.response.data : error.message);
        throw new Error(error.response ? error.response.data.message : error.message); // Reject with the error message
    }
}

module.exports = sendOtp;