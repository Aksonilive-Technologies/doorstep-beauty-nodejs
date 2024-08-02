const express = require("express");
const { check } = require("express-validator");
const {
  Register,
  Login,
  AllAdmin,
  DeleteAdmin,
  UpdateAdmin,
  changeStatus
} = require("../controllers/adminController.js"); // Importing both functions

const router = express.Router();

router.post(
  "/register",
  [
    check("name", "Name is required").isString(),
    check("username", "Username is required").isString(),
    check("password", "Password should be at least 6 characters").isLength({
      min: 6,
    }),
  ],
  Register
);

router.post(
  "/login",
  [
    check("username", "Username is required").isString(),
    check("password", "Password should be at least 6 characters").isLength({
      min: 6,
    }),
  ],
  Login
);

//get all admin
router.get("/all", AllAdmin);

router.get("/status", changeStatus)

//delete admin
router.put("/delete", DeleteAdmin);

//update admin
router.put("/update", UpdateAdmin);

module.exports = router;
