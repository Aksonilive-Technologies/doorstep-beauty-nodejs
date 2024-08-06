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
const verifyToken = require("../middleware/verifyToken.js");



router.post("/register", register);
router.get("/all", verifyToken, getAllCustomers);
router.put("/update", verifyToken, updateCustomer);
router.delete("/delete", verifyToken, deleteCustomer);
router.put("/change-status", verifyToken, changeStatusDeletedCustomer);
router.get('/profile/fetch',verifyToken, customerById);
router.get('/checkExistance',verifyToken, checkExistance)
module.exports = router;
