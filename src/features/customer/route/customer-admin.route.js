// customersRoute.js
import express from "express";
import {
  getAllCustomers,
  downloadExcelSheet,
  deleteCustomer,
  changeStatusDeletedCustomer,
} from "../controller/customer-admin.controller.js";
const router = express.Router();

router.get("/all", getAllCustomers);
router.delete("/delete", deleteCustomer);
router.put("/change-status", changeStatusDeletedCustomer);
router.get("/download-excel", downloadExcelSheet);

export default router;
