const axios = require("axios");
const AppError = require("./appError");

// Gupshup API Helper Class
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
                id: process.env.otp_template_id,
                params: [otp],
            }),
        });

        const config = this.createConfig(data);

        try {
            console.log("Sending OTP...");
            const response = await axios(config);
            console.log("OTP sent successfully:", JSON.stringify(response.data));
            return response.data;
        } catch (error) {
            console.error("Error sending OTP:", error.response ? error.response.data : error.message);
            throw new AppError(error.response?.data?.message || "Failed to send OTP", error.response?.status || 500);
        }
    }

    // Function to send a template message
    async sendWelcomeMessage(phoneNumber, customerName) {
        const data = new URLSearchParams({
            source: this.source,
            destination: "91" + phoneNumber,
            "src.name": this.appName,
            template: JSON.stringify({
                id: process.env.welcome_message_template_id,
                params: [customerName],
            }),
        });

        const config = this.createConfig(data);

        try {
            console.log("Sending welcome message...");
            const response = await axios(config);
            console.log("Welcome message sent successfully:", JSON.stringify(response.data));
            return response.data;
        } catch (error) {
            console.error("Error sending welcome message:", error.response ? error.response.data : error.message);
            throw new AppError(error.response?.data?.message || "Failed to send welcome message", error.response?.status || 500);
        }
    }

    // Add more functions as needed
}

module.exports = new WaMsgService();
