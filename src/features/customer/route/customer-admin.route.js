// customersRoute.js
import express from "express";
import {
  getAllCustomers,
  downloadExcelSheet,
  searchCustomer,
  deleteCustomer,
  changeStatusDeletedCustomer,
} from "../controller/customer-admin.controller.js";
const router = express.Router();

router.get("/all", getAllCustomers);
router.delete("/delete", deleteCustomer);
router.put("/change-status", changeStatusDeletedCustomer);
router.get("/download-excel", downloadExcelSheet);
router.get("/searchCustomer", searchCustomer);

export default router;
