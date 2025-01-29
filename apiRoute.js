const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const app = express();
app.use(express.json());
const AppError = require("./utility/appError.js");
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



const graphRoute = require("./extras/graphRoute.js");

//***************Customer Route API************************ */

const customerRoute = require("./src/features/customer/route/customer-app.route.js");
const customerCategoryRoute = require("./src/features/category/route/category-app.route.js");
const customerProductRoute = require("./src/features/product/route/product-app.route.js");
const customerBookingRoute = require("./src/features/booking/route/booking-customer.route.js");
const customerCartRoute = require("./src/features/cart/route/cart.route.js");
const customerAddressRoute = require("./src/features/customer-address/route/customer-address.route.js");
const customerBannerRoute = require("./src/features/banner/route/banner-app.route.js");
const customerPackageRoute = require("./src/features/package/route/package-app.route.js");
const customerFeedbackRoute = require("./src/features/feedback/route/feedback-app.route.js");
const customerComplaintRoute = require("./src/features/complaint/route/complaint-app.route.js");
const customerMembershipRoute = require("./src/features/membership/route/membership-app.route.js");
const customerSlotRoute = require("./src/features/slot/route/slot-app.route.js");

app.use("/api/v1/customer/category", customerCategoryRoute);
app.use("/api/v1/customer/product", customerProductRoute);
app.use("/api/v1/customer/booking", customerBookingRoute);
app.use("/api/v1/customer/cart", customerCartRoute);
app.use("/api/v1/customer/address", customerAddressRoute);
app.use("/api/v1/customer/banner", customerBannerRoute);
app.use("/api/v1/customer/package", customerPackageRoute);
app.use("/api/v1/customer/feedback", customerFeedbackRoute);
app.use("/api/v1/customer/complain", customerComplaintRoute);
app.use("/api/v1/customer/membership", customerMembershipRoute);
app.use("/api/v1/customer/slot", customerSlotRoute);
app.use("/api/v1/customer", customerRoute);

//**************Partner Route API************************ */

const partnerRoute = require("./src/features/partner/route/partner-app.route.js");
const partnerBookingRoute = require("./src/features/booking/route/booking-partner.route.js");
const partnerStockRoute = require("./src/features/stock/route/stock-partner.route.js");
const parnterStockBookingRoute = require("./src/features/stock-booking/route/stock-booking.route.js");
const partnerCartRoute = require("./src/features/partner-cart/route/partner-cart.route.js");

app.use("/api/v1/partner", partnerRoute);
app.use("/api/v1/partner/booking", partnerBookingRoute);
app.use("/api/v1/partner/stock", partnerStockRoute);
app.use("/api/v1/partner/stock/booking", parnterStockBookingRoute);
app.use("/api/v1/partner/cart", partnerCartRoute);

//**************Admin Route API**************************** */
const adminRoute = require("./src/features/admin/route/admin.route.js");
const adminCustomerRoute = require("./src/features/customer/route/customer-admin.route.js");
const adminPartnerRoute = require("./src/features/partner/route/partner-admin.route.js");
const bannerRoute = require("./src/features/banner/route/banner-admin.route.js");
const categoryAdminRoute = require("./src/features/category/route/category-admin.route.js");
const subcategoryAdminRoute = require("./src/features/subcategory/route/subcategory-admin.route.js");
const productAdminRoute = require("./src/features/product/route/product-admin.route.js");
const packageAdminRoute = require("./src/features/package/route/package-admin.route.js");
const membershipRoute = require("./src/features/membership/route/membership-admin.route.js");
const adminComplainRoute = require("./src/features/complaint/route/complaint-admin.route.js");
const feedbackRoute = require("./src/features/feedback/route/feedback-admin.route.js");
const notificationRoute = require("./src/features/notification/route/notification.route.js");
const offerRoute = require("./src/features/offers/route/offers.route.js");
const slotRoute = require("./src/features/slot/route/slot-admin.route.js");
const stockRoute = require("./src/features/stock/route/stock-admin.route.js");
const bookingAdminRoute = require("./src/features/booking/route/booking-admin.route.js");

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

const spareFileUploadRoute = require("./extras/spareFileUploadRoute.js");

app.use("/api/v1/spare-file", spareFileUploadRoute);

//**************User Route API************************ */

const otpRoute = require("./src/features/otp/route/otp.route.js");
const firebaseTokenRoute = require("./src/features/firebase-token/route/firebase-token.route.js");
const appVersionRoute = require("./src/features/app-version/route/app-version.route.js");
app.use("/api/v1/user/auth/otp", otpRoute);
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
