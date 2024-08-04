// customersRoute.js
const express = require("express");
const router = express.Router();
const {
  register,
  getAllCustomers,
  updateCustomer,
  deleteCustomer,
  changeStatusDeletedCustomer,
  customerById,
  checkExistance
} = require("../controller/customerController.js");



router.post("/register", register);
router.get("/all", getAllCustomers);
router.put("/update", updateCustomer);
router.delete("/delete", deleteCustomer);
router.put("/change-status", changeStatusDeletedCustomer);
router.get('/profile/fetch',customerById);
router.get('/checkExistance',checkExistance)
module.exports = router;
