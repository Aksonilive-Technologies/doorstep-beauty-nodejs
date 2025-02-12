import express from "express";
const router = express.Router();
import * as customerAddressController from "../controller/customer-address.controller.js";

// Route to create a new address
router.post("/add", customerAddressController.createAddress);
router.get("/fetch/all", customerAddressController.getAddressesByCustomer);
// router.get('/', customerAddressController.getAddressById);
router.post("/update", customerAddressController.updateAddress);
router.delete("/delete", customerAddressController.deleteAddress);
router.get("/fetch/primary", customerAddressController.getPrimaryAddress);

export default router;
