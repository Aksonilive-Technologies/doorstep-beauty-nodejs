// customersRoute.js
const express = require("express");
const {
  Register,
  getAllCustomers,
  updateCustomer,
  deleteCustomer,
  changeStatusDeletedCustomer
} = require("../controllers/customersController.js");

const router = express.Router();

router.post("/register", Register);
router.get("/all", getAllCustomers);
router.put("/update", updateCustomer);
router.delete("/delete", deleteCustomer);
router.put("/change-status", changeStatusDeletedCustomer);
module.exports = router;
