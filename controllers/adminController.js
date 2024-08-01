const bcryptjs = require("bcryptjs");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel.js");

// Admin Registration
const Register = async (req, res) => {
  const { name, username, password } = req.body;

  // Validate request data
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if username already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: "Username already exists", success: false });
    }

    // Hash the password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create new admin
    const newAdmin = new Admin({
      name,
      username,
      password: hashedPassword,
    });

    // Save the new admin to the database
    await newAdmin.save();

    res
      .status(201)
      .json({ message: "Admin registered successfully", success: true });
  } catch (error) {
    console.error("Error while registering Admin:", error);
    res.status(500).json({
      message: "Error occurred while registering admin",
      success: false,
    });
  }
};
// Admin Login
const Login = async (req, res) => {
  const { username, password } = req.body;

  // Validate request data
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Fetch admin data
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({
        message: "Invalid username or password",
        success: false,
      });
    }
    if (admin.isActive === false) {
      return res.status(401).json({
        message: "Your account is inactive, Please contact support team",
        success: false,
      });
    }
    if (admin.isDeleted === true) {
      return res.status(401).json({
        message: "Your account is deleted, Please contact support team",
        success: false,
      });
    }

    // Validate password
    const isValidPassword = await bcryptjs.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: "Invalid username or password",
        success: false,
      });
    }

    // Generate JWT token
    const token = jwt.sign({ AdminId: admin._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    // Set cookie with the token
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // Return success response with admin name and id
    return res.status(200).json({
      data: {
        name: admin.name, // Include admin's name
        id: admin._id, // Include admin's ID
      },
      message: "Admin logged in successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error while logging in:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

const AllAdmin = async (req, res) => {
  try {
    const admin = await Admin.find().select("-password");
    return res.status(200).json(admin);
  } catch (error) {
    console.error("Error while fetching all admins:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

const DeleteAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const admin = await Admin.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Admin deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error while deleting Admin:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

const UpdateAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const checkAdmin = await Admin.findById(id);

    if (checkAdmin.isDeleted === true) {
      return res.status(404).json({
        message: "Admin deleted, Please Contact with support team",
        success: false,
      });
    }

    const { name, password } = req.body;

    // Create an update object dynamically
    const updateData = {};
    if (name) updateData.name = name;
    if (password) {
      const hashedPassword = await bcryptjs.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Update the admin
    const admin = await Admin.findByIdAndUpdate(id, updateData, { new: true });

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Admin updated successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error while updating Admin:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

module.exports = {
  Register,
  Login,
  AllAdmin,
  DeleteAdmin,
  UpdateAdmin,
};
