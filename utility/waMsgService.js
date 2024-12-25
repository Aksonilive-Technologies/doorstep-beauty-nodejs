const axios = require("axios");
const AppError = require("./appError");

class WaMsgService {
    constructor() {
        this.baseUrl = "https://api.gupshup.io/wa/api/v1/template/msg";
        this.apiKey = process.env.GUPSHUP_API_KEY; // Gupshup API key
        this.source = process.env.GUPSHUP_Phone_Number; // Gupshup-approved WhatsApp number
        this.appName = process.env.GUPSHUP_App_Name; // App name
    }

    // Helper method to create a request configuration
    createConfig(data) {
        return {
            method: "post",
            url: `${this.baseUrl}`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                apikey: this.apiKey,
            },
            data: data.toString(),
        };
    }

    // Function to send an OTP message
    async sendOtp(phoneNumber, otp) {
        const data = new URLSearchParams({
            source: this.source,
            destination: "91" + phoneNumber,
            "src.name": this.appName,
            template: JSON.stringify({
                id: "39f46c01-4fa3-46a8-958c-bc8710be4b1e",
                params: [otp],
            }),
        });

        const config = this.createConfig(data);

        try {
            const response = await axios(config);
            return response.data;
        } catch (error) {
            throw new AppError(error.response?.data?.message || "Failed to send OTP", error.response?.status || 500);
        }
    }

    // Function to send a welcome message
    async sendWelcomeMessage(phoneNumber, customerName) {
        const data = new URLSearchParams({
            source: this.source,
            destination: "91" + phoneNumber,
            "src.name": this.appName,
            template: JSON.stringify({
                id: "bb1a1c31-b6ff-4b88-9e53-2c3ab55d407e",
                params: [customerName],
            }),
        });

        const config = this.createConfig(data);

        try {
            const response = await axios(config);
            return response.data;
        } catch (error) {
            throw new AppError(error.response?.data?.message || "Failed to send welcome message", error.response?.status || 500);
        }
    }

    // Function to send booking confirmation message to customer
    async sendCusBoookingConfirmationMessage(phoneNumber, customerName, serviceName, itemCount, date, time, address, bookingAmount) {
        const data = new URLSearchParams({
            source: this.source,
            destination: "91" + phoneNumber,
            "src.name": this.appName,
            template: itemCount>1?JSON.stringify({
                id: "c51d0f0a-5400-446d-a6c5-3cfacf0e50f6",
                params: [customerName,serviceName,itemCount,date,time,address,bookingAmount],
            }):JSON.stringify({
                id: "017d7294-4a22-4db7-85fb-61e9db480eb6",
                params: [customerName,serviceName,date,time,address,bookingAmount],
            }),
        });

        const config = this.createConfig(data);

        try {
            const response = await axios(config);
            return response.data;
        } catch (error) {
            throw new AppError(error.response?.data?.message || "Failed to send welcome message", error.response?.status || 500);
        }
    }
}

module.exports = new WaMsgService();
