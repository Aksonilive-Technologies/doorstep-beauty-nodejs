const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const app = express();
app.use(express.json());
const AppError = require("../utility/appError.js");
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

const authorizationRoute = require("./authorizationRoute.js");
const bookingRoute = require("./bookingRoute.js");
const partnerBookingRoute = require("./partnerBookingRoute.js");
const bookingAdminRoute = require("./bookingAdminRoute.js");
const productRoute = require("./productRoute.js");
const partnerRoute = require("./partnerRoute.js");
const adminPartnerRoute = require("./adminPartnerRoute.js");
const adminCustomerRoute = require("./adminCustomerRoute.js");
const slotCustomerRoute = require("./slotCustomerRoute.js");
const slotRoute = require("./slotRoutes.js");
const appVersionRoute = require("./appVersionRoute.js");
const customerRoute = require("./customerRoute.js");
const cartRoute = require("./cartRoute.js");
const bannerRoute = require("./bannerRoute.js");
const membershipRoute = require("./membershipRoute.js");
const feedbackRoute = require("./feedbackRoute.js");
const customerAddressRoute = require("./customerAddressRoute.js");
const offerRoute = require("./offerRoute.js");
const stockRoute = require("./stockRoute.js");
const adminRoute = require("./adminRoute.js");
const notificationRoute = require("./notificationRoutes.js");
const productAdminRoute = require("./productAdminRoute.js");
const packageAdminRoute = require("./packageAdminRoute.js");
const adminComplainRoute = require("./adminComplainRoute.js");
const packageAppRoute = require("./packageAppRoute.js");
const bannerAppRoute = require("./bannerAppRoute.js");
const categoryAppRoute = require("./categoryAppRoute.js");
const categoryAdminRoute = require("./categoryAdminRoute.js");
const subcategoryAdminRoute = require("../src/features/subcategory/route/subcategory.admin.route.js");
const feedbackCustomerRoute = require("./feedbackCustomerRoute.js");
const customerComplaintRoute = require("./customerComplaintRoute.js");
const membershipCustomerRoute = require("./membershipCustomerRoute.js");
const firebaseTokenRoute = require("./firebaseTokenRoute.js");
const partnerWalletRoute = require("./partnerWalletRoute.js");
const partnerStockRoute = require("./partnerStockRoute.js");
const parnterStockBookingRoute = require("./parnterStockBookingRoute.js");
const partnerCartRoute = require("./partnerCartRoute.js");
const graphRoute = require("./graphRoute.js");
const spareFileUploadRoute = require("./spareFileUploadRoute.js");

//***************Customer Route API************************ */

app.use("/api/v1/customer/category", categoryAppRoute);
app.use("/api/v1/customer/product", productRoute);
app.use("/api/v1/customer/booking", bookingRoute);
app.use("/api/v1/customer/cart", cartRoute);
app.use("/api/v1/customer/address", customerAddressRoute);
app.use("/api/v1/customer/banner", bannerAppRoute);
app.use("/api/v1/customer/package", packageAppRoute);
app.use("/api/v1/customer/feedback", feedbackCustomerRoute);
app.use("/api/v1/customer/complain", customerComplaintRoute);
app.use("/api/v1/customer/membership", membershipCustomerRoute);
app.use("/api/v1/customer/wallet", customerRoute);
app.use("/api/v1/customer/slot", slotCustomerRoute);
app.use("/api/v1/customer", customerRoute);

//**************Partner Route API************************ */
app.use("/api/v1/partner", partnerRoute);
app.use("/api/v1/partner/wallet", partnerWalletRoute);
app.use("/api/v1/partner/booking", partnerBookingRoute);
app.use("/api/v1/partner/stock", partnerStockRoute);
app.use("/api/v1/partner/stock/booking", parnterStockBookingRoute);
app.use("/api/v1/partner/cart", partnerCartRoute);

//**************Admin Route API**************************** */
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/admin/customer", adminCustomerRoute);
app.use("/api/v1/admin/partner", adminPartnerRoute);
app.use("/api/v1/admin/banner", bannerRoute);
app.use("/api/v1/admin/category", categoryAdminRoute);
app.use("/api/v1/admin/subcategory", subcategoryAdminRoute);
app.use("/api/v1/admin/product", productAdminRoute);
app.use("/api/v1/admin/package", packageAdminRoute);
app.use("/api/v1/admin/membership", membershipRoute);
app.use("/api/v1/admin/complain", adminComplainRoute);
app.use("/api/v1/admin/feedback", feedbackRoute);
app.use("/api/v1/admin/notification", notificationRoute);
app.use("/api/v1/admin/offers", offerRoute);
app.use("/api/v1/admin/slot", slotRoute);
app.use("/api/v1/admin/stock", stockRoute);
app.use("/api/v1/admin/booking", bookingAdminRoute);
app.use("/api/v1/admin/graph", graphRoute);

//**************Spare Route API************************ */
app.use("/api/v1/spare-file", spareFileUploadRoute);

//**************User Route API************************ */
app.use("/api/v1/customer/auth/otp", authorizationRoute);
app.use("/api/v1/user/auth/otp", authorizationRoute);
app.use("/api/v1/user/fcm/token", firebaseTokenRoute);
app.use("/api/v1/user/app/version", appVersionRoute);
// comment

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
