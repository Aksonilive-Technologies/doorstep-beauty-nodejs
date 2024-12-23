const axios = require("axios");
const AppError = require("./appError");
const catchAsync = require("./catchAsync");

async function sendOtp(phoneNumber, otp) {
    // const data = {
    //     countryCode: "+91", // Assuming it's an Indian number, modify as per the requirement
    //     phoneNumber: phoneNumber,
    //     callbackData: "OTP Request",
    //     type: "Template",
    //     template: {
    //         name: "send_otp_v1", // Replace with the actual template name for OTP
    //         languageCode: "en",
    //         bodyValues: [otp],
    //         buttonValues: {
    //             "0": [otp],
    //         }
    //     },
    // };

    const data = new URLSearchParams({
        source: process.env.GUPSHUP_Phone_Number, // Replace with your Gupshup-approved WhatsApp number
        destination: "91"+phoneNumber, // Customer's phone number in E.164 format (e.g., 919876543210 for +91)
        "src.name": process.env.GUPSHUP_App_Name,
        template: JSON.stringify({
            id: process.env.otp_template_id, // Replace with your Gupshup-approved template ID
            params: [otp], // Replace with your template parameters
        }), 
    });

    console.log(data.toString)

    const config = {
        // method: 'post',
        // maxBodyLength: Infinity,
        // url: 'https://api.interakt.ai/v1/public/message/',
        // headers: {
        //     'Content-Type': 'application/json',
        //     "Authorization": "Basic " + process.env.INTERAKT_API_KEY, // Replace with your actual API key
        // },
        // data: data,

        method: "post",
        url: "https://api.gupshup.io/wa/api/v1/template/msg",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            apikey: process.env.GUPSHUP_API_KEY, // Use your Gupshup API key from environment variables
        },
        data: data.toString(),
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