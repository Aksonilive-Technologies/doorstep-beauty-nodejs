const express = require("express");
const { check } = require("express-validator");
const {
  Register,
  Login,
  AllAdmin,
  DeleteAdmin,
  UpdateAdmin,
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
router.get("/admins", AllAdmin);

//delete admin
router.put("/delete/:id", DeleteAdmin);

//update admin
router.put("/update/:id", UpdateAdmin);

module.exports = router;
