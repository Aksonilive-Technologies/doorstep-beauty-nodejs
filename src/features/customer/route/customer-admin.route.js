// customersRoute.js
const express = require("express");
const {
  getAllCustomers,
  downloadExcelSheet,
  searchCustomer,
  deleteCustomer,
  changeStatusDeletedCustomer,
} = require("../controller/customer-admin.controller");
const router = express.Router();

router.get("/all", getAllCustomers);
router.delete("/delete", deleteCustomer);
router.put("/change-status", changeStatusDeletedCustomer);
router.get("/download-excel", downloadExcelSheet);
router.get("/searchCustomer", searchCustomer);

module.exports = router;
