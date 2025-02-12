import express from "express";
import {
  getCustomerStats,
  getTopCustomerByBookings,
} from "../src/features/customer/controller/customer-admin.controller.js";
import {
  getComplaintStatsByCategory,
  getResolvedComplaintStatsByCategory,
} from "../src/features/complaint/controller/complaint-admin.controller.js";
import {
  getTopPartnerByServiceCount,
} from "../src/features/booking/controller/booking-partner.controller.js";
const router = express.Router();

// Define the endpoint for fetching customer stats
router.get("/customer-stats", getCustomerStats);
router.get("/customer-booking-stats", getTopCustomerByBookings);
router.get("/service-provided-partner", getTopPartnerByServiceCount);
router.get("/total-complaints-stats", getComplaintStatsByCategory);
router.get("/resolved-complaints-stats", getResolvedComplaintStatsByCategory);

export default router;
