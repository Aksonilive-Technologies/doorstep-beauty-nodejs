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
const bookingRoute = require("./bookingRoute.js");
const bookingAdminRoute = require("./bookingAdminRoute.js");
const productRoute = require("./productRoute");
const partnerRoute = require("./partnerRoute");
const slotCustomerRoute = require("./slotCustomerRoute");
const slotRoute = require("./slotRoutes");
const appVersionRoute = require("./appVersionRoute");
const customerRoute = require("./customerRoute");
const cartRoute = require("./cartRoute");
const bannerRoute = require("./bannerRoute");
const membershipRoute = require("./membershipRoute");
const feedbackRoute = require("./feedbackRoute");
const customerAddressRoute = require("./customerAddressRoute");
const categoryRoute = require("./categoryRoute");
const offerRoute = require("./offerRoute");
const stockRoute = require("./stockRoute");
const adminRoute = require("./adminRoute");
const notificationRoute = require("./notificationRoutes");

//***************Customer Route************************ */

app.use("/api/v1/customer/auth/otp", authorizationRoute);
app.use("/api/v1/customer/category", require("./categoryAppRoute"));
app.use("/api/v1/customer/product", productRoute);
app.use("/api/v1/customer/booking", bookingRoute);
app.use("/api/v1/customer/cart", cartRoute);
app.use("/api/v1/customer/address", customerAddressRoute);
app.use("/api/v1/customer/banner", require("./bannerAppRoute"));
app.use("/api/v1/customer/package", require("./packageAppRoute.js"));
app.use("/api/v1/customer/feedback", require("./feedbackCustomerRoute.js"));
app.use("/api/v1/customer/complain", require("./customerComplaintRoute.js"));
app.use("/api/v1/customer/membership", require("./membershipCustomerRoute.js"));
app.use("/api/v1/customer/wallet", customerRoute);
app.use("/api/v1/customer/slot", slotCustomerRoute);
app.use("/api/v1/customer", customerRoute);

//**************Admin Route**************************** */
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/admin/partner", partnerRoute);
app.use("/api/v1/admin/banner", bannerRoute);
app.use("/api/v1/admin/category", categoryRoute);
app.use("/api/v1/admin/product", require("./productAdminRoute"));
app.use("/api/v1/admin/pakage", require("./packageAdminRoute"));
app.use("/api/v1/admin/pakage", require("./packageAdminRoute"));
app.use("/api/v1/admin/membership", membershipRoute);
app.use("/api/v1/admin/complain", require("./adminComplainRoute.js"));
app.use("/api/v1/admin/feedback", feedbackRoute);
app.use("/api/v1/admin/notification", notificationRoute);
app.use("/api/v1/admin/offers", offerRoute);
app.use("/api/v1/admin/slot", slotRoute);
app.use("/api/v1/admin/category", require("./categoryAdminRoutes.js"));
app.use("/api/v1/admin/stock", stockRoute);
app.use("/api/v1/admin/booking", bookingAdminRoute);

//**************Testing Route ApI************************ */
app.use("/api/v1/testing/admin", require("./testingRoute.js"));

//**************User Route API************************ */
app.use("/api/v1/user/fcm/token", require("./firebaseTokenRoute.js"));
app.use("/api/v1/user/app/version", appVersionRoute);


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
