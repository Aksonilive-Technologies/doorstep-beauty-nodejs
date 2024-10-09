// customersRoute.js
const express = require("express");
const {
  getAllCustomers,
  downloadExcelSheet,
  searchCustomer,
} = require("../controller/adminCustomerController");
const router = express.Router();

router.get("/all", getAllCustomers);
router.get("/download-excel", downloadExcelSheet);
router.get("/searchCustomer", searchCustomer);

module.exports = router;
