const express = require("express");
const {
  getCustomerStats,
  getTopCustomerByBookings,
} = require("../src/features/customer/controller/customer-admin.controller");
const {
  getComplaintStatsByCategory,
  getResolvedComplaintStatsByCategory,
} = require("../src/features/complaint/controller/complaint-admin.controller");
const {
  getTopPartnerByServiceCount,
} = require("../src/features/booking/controller/booking-partner.controller");
const router = express.Router();

// Define the endpoint for fetching customer stats
router.get("/customer-stats", getCustomerStats);
router.get("/customer-booking-stats", getTopCustomerByBookings);
router.get("/service-provided-partner", getTopPartnerByServiceCount);
router.get("/total-complaints-stats", getComplaintStatsByCategory);
router.get("/resolved-complaints-stats", getResolvedComplaintStatsByCategory);

module.exports = router;
