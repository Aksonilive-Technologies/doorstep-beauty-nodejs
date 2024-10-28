const express = require("express");
const {
  getCustomerStats,
  getTopCustomerByBookings,
} = require("../controller/customerController");
const { getComplaintStatsByCategory, getResolvedComplaintStatsByCategory } = require("../controller/customerComplainController");
const { getTopPartnerByServiceCount } = require("../controller/partnerBookingController");
const router = express.Router();

// Define the endpoint for fetching customer stats
router.get("/customer-stats", getCustomerStats);
router.get("/customer-booking-stats", getTopCustomerByBookings);
router.get("/service-provided-partner", getTopPartnerByServiceCount);
router.get("/total-complaints-stats", getComplaintStatsByCategory);
router.get("/resolved-complaints-stats", getResolvedComplaintStatsByCategory);

module.exports = router;
