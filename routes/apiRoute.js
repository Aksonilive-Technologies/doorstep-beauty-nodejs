const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const app = express();
app.use(express.json());
const AppError = require("../utility/appError");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "100mb" }));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
const multer = require("multer");
// Connect to MongoDB
mongoose.connect(process.env.db_url);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

const authorizationRoute = require("./authorizationRoute");

//***************Customer Route************************ */

app.use("/api/v1/customer/auth/otp", authorizationRoute);
app.use("/api/v1/customer/category", require("./categoryAppRoute"));

app.use("/api/v1/customer/product", require("./productRoute"));
app.use("/api/v1/customer/order", require("./orderRoute"));
app.use("/api/v1/customer/cart", require("./cartRoute"));
app.use("/api/v1/customer/service", require("./serviceRoute"));
app.use("/api/v1/customer/address", require("./customerAddressRoute"));
app.use("/api/v1/customer/banner", require("./bannerAppRoute"));
app.use("/api/v1/customer/package", require("./packageAppRoute.js"));
app.use("/api/v1/customer/feedback", require("./feedbackCustomerRoute.js"));
app.use("/api/v1/customer/complain", require("./customerComplaintRoute.js"));
app.use("/api/v1/customer/membership", require("./membershipCustomerRoute.js"));
app.use("/api/v1/customer/wallet", require("./customerRoute"));
//app.use("/api/v1/customer/wishlist", require("./wishlistRoute"));
app.use("/api/v1/customer", require("./customerRoute"));

//**************Admin Route**************************** */

app.use("/api/v1/admin", require("./adminRoute"));

//**************Partner Route************************ */
app.use("/api/v1/partner", require("./partnerRoute"));

//**************Banner Route************************ */
app.use("/api/v1/admin/banner", require("./bannerRoute"));
app.use("/api/v1/customer/stock", require("./stockRoute"));
app.use("/api/v1/admin/category", require("./categoryRoute"));

//**************Product Route************************ */
app.use("/api/v1/admin/product", require("./productAdminRoute"));
app.use("/api/v1/admin/pakage", require("./packageAdminRoute"));
app.use("/api/v1/admin/pakage", require("./packageAdminRoute"));

//**************testing Apis************************ */
app.use("/api/v1/testing/admin", require("./testingRoute.js"));

//**************package Apis************************ */
app.use("/api/v1/admin/package", require("./packageAdminRoute.js"));

//**************Membership Apis************************ */
app.use("/api/v1/admin/membership", require("./membershipRoute.js"));

//**************complain Apis************************ */
app.use("/api/v1/admin/complain", require("./adminComplainRoute.js"));

//**************feedback Apis************************ */
app.use("/api/v1/admin/feedback", require("./feedbackRoute.js"));

app.all("*", async (request, response, next) => {
  return response.status(404).json({
    success: false,
    message: "Can't find " + request.originalUrl + " on this server",
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  res.status(500);
  res.json({
    error: {
      message: error.message,
    },
  });
});
module.exports = app;
