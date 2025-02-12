import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(express.json());
import "./utility/appError.js";
import bodyParser from "body-parser";
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
import "multer";
// Connect to MongoDB
mongoose.connect(process.env.db_url);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

import graphRoute from "./extras/graphRoute.js";

//***************Customer Route API************************ */

import customerRoute from "./src/features/customer/route/customer-app.route.js";
import customerCategoryRoute from "./src/features/category/route/category-app.route.js";
import customerProductRoute from "./src/features/product/route/product-app.route.js";
import customerBookingRoute from "./src/features/booking/route/booking-customer.route.js";
import customerCartRoute from "./src/features/cart/route/cart.route.js";
import customerAddressRoute from "./src/features/customer-address/route/customer-address.route.js";
import customerBannerRoute from "./src/features/banner/route/banner-app.route.js";
import customerFeedbackRoute from "./src/features/feedback/route/feedback-app.route.js";
import customerComplaintRoute from "./src/features/complaint/route/complaint-app.route.js";
import customerMembershipRoute from "./src/features/membership/route/membership-app.route.js";
import customerSlotRoute from "./src/features/slot/route/slot-app.route.js";

app.use("/api/v1/customer/category", customerCategoryRoute);
app.use("/api/v1/customer/product", customerProductRoute);
app.use("/api/v1/customer/booking", customerBookingRoute);
app.use("/api/v1/customer/cart", customerCartRoute);
app.use("/api/v1/customer/address", customerAddressRoute);
app.use("/api/v1/customer/banner", customerBannerRoute);
app.use("/api/v1/customer/feedback", customerFeedbackRoute);
app.use("/api/v1/customer/complain", customerComplaintRoute);
app.use("/api/v1/customer/membership", customerMembershipRoute);
app.use("/api/v1/customer/slot", customerSlotRoute);
app.use("/api/v1/customer", customerRoute);

//**************Partner Route API************************ */

import partnerRoute from "./src/features/partner/route/partner-app.route.js";
import partnerBookingRoute from "./src/features/booking/route/booking-partner.route.js";
import partnerStockRoute from "./src/features/stock/route/stock-partner.route.js";
import parnterStockBookingRoute from "./src/features/stock-booking/route/stock-booking.route.js";
import partnerCartRoute from "./src/features/partner-cart/route/partner-cart.route.js";

app.use("/api/v1/partner", partnerRoute);
app.use("/api/v1/partner/booking", partnerBookingRoute);
app.use("/api/v1/partner/stock", partnerStockRoute);
app.use("/api/v1/partner/stock/booking", parnterStockBookingRoute);
app.use("/api/v1/partner/cart", partnerCartRoute);

//**************Admin Route API**************************** */
import adminRoute from "./src/features/admin/route/admin.route.js";
import adminCustomerRoute from "./src/features/customer/route/customer-admin.route.js";
import adminPartnerRoute from "./src/features/partner/route/partner-admin.route.js";
import bannerRoute from "./src/features/banner/route/banner-admin.route.js";
import categoryAdminRoute from "./src/features/category/route/category-admin.route.js";
import subcategoryAdminRoute from "./src/features/subcategory/route/subcategory-admin.route.js";
import productAdminRoute from "./src/features/product/route/product-admin.route.js";
import membershipRoute from "./src/features/membership/route/membership-admin.route.js";
import adminComplainRoute from "./src/features/complaint/route/complaint-admin.route.js";
import feedbackRoute from "./src/features/feedback/route/feedback-admin.route.js";
import notificationRoute from "./src/features/notification/route/notification.route.js";
import offerRoute from "./src/features/offers/route/offers.route.js";
import slotRoute from "./src/features/slot/route/slot-admin.route.js";
import stockRoute from "./src/features/stock/route/stock-admin.route.js";
import bookingAdminRoute from "./src/features/booking/route/booking-admin.route.js";

app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/admin/customer", adminCustomerRoute);
app.use("/api/v1/admin/partner", adminPartnerRoute);
app.use("/api/v1/admin/banner", bannerRoute);
app.use("/api/v1/admin/category", categoryAdminRoute);
app.use("/api/v1/admin/subcategory", subcategoryAdminRoute);
app.use("/api/v1/admin/product", productAdminRoute);
app.use("/api/v1/admin/membership", membershipRoute);
app.use("/api/v1/admin/complain", adminComplainRoute);
app.use("/api/v1/admin/feedback", feedbackRoute);
app.use("/api/v1/admin/notification", notificationRoute);
app.use("/api/v1/admin/offers", offerRoute);
app.use("/api/v1/admin/slot", slotRoute);
app.use("/api/v1/admin/stock", stockRoute);
app.use("/api/v1/admin/booking", bookingAdminRoute);
app.use("/api/v1/admin/graph", graphRoute);

//**************Extra Route API************************ */

import extraRoute from "./extras/extra.route.js";

app.use("/api/v1/extra", extraRoute);

//**************User Route API************************ */

import otpRoute from "./src/features/otp/route/otp.route.js";
import firebaseTokenRoute from "./src/features/firebase-token/route/firebase-token.route.js";
import appVersionRoute from "./src/features/app-version/route/app-version.route.js";

app.use("/api/v1/user/auth/otp", otpRoute);
app.use("/api/v1/user/fcm/token", firebaseTokenRoute);
app.use("/api/v1/user/app/version", appVersionRoute);


app.all("*", async (request, response) => {
  return response.status(404).json({
    success: false,
    message: "Can't find " + request.originalUrl + " on this server",
  });
});

// Error handling middleware
app.use((error, req, res) => {
  res.status(500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

export default app;
