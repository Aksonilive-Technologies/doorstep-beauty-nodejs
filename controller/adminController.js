const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel.js");
const mongoose = require("mongoose");

exports.register = async (req, res) => {
  const { name, username, password, email, role } = req.body;
  const { adminId } = req.query;

  try {
    if(!adminId){
      return res
        .status(400)
        .json({ success: false, message: "Admin ID is missing" });
    }
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res
        .status(400)
        .json({ success: false, message: "Admin not found" });
    }
    if(admin.role !== 'all'){
      return res
        .status(401)
        .json({ success: false, message: "You are not authorized" });}

    const requiredFields = { name, username, password, email, role };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        return res
          .status(400)
          .json({ success: false, message: `Please fill ${key}` });
      }
    }

    const [existingAdminUser, existingAdminEmail] = await Promise.all([
      Admin.findOne({ username }),
      Admin.findOne({ email }),
    ]);

    if (existingAdminUser) {
      return res
        .status(400)
        .json({ success: false, message: "Username already exists" });
    }

    if (existingAdminEmail) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const newAdmin = new Admin({
      name,
      username,
      password: hashedPassword,
      email,
      role,
    });

    await newAdmin.save();
    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
    });
  } catch (error) {
    console.error("Error while registering Admin:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while registering admin",
    });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  //
  // Validate request data
  if (!username) {
    return res
      .status(400)
      .json({ success: false, message: "Please fill username" });
  }
  if (!password) {
    return res
      .status(400)
      .json({ success: false, message: "Please fill password" });
  }

  try {
    // Fetch admin data
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }
    if (admin.isActive === false) {
      return res.status(401).json({
        success: false,
        message: "Your account is inactive, please contact superadmin.",
      });
    }
    if (admin.isDeleted === true) {
      return res.status(401).json({
        success: false,
        message: "Your account is suspended, please contact superadmin.",
      });
    }

    // Validate password
    const isValidPassword = await bcryptjs.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign({ AdminId: admin._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    // Return success response with admin name and id
    return res.status(200).json({
      success: true,
      message: "Admin logged in successfully",
      data: {
        id: admin._id,
        name: admin.name,
        username: admin.username,
        token: token,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Error while logging in:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

exports.allAdmin = async (req, res) => {
  const { adminId } = req.query;
  try {

    if (!adminId) {
      return res.status(400).json({
        message: "Admin ID is required",
        success: false,
      });
    }

    // Find the logged-in user's level
    const loggedInUser = await Admin.findById(adminId);
    if (!loggedInUser) {
      return res.status(404).json({
        message: "Admin not found",
        success: false,
      });
    }
    if(loggedInUser.role !== 'all'){
      return res.status(401).json({
        message: "You are not authorized to view this page",
        success: false,
      });
    }

    // Handle pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find admins with a higher level than the logged-in user, with pagination
    // Change: Updated condition to { $gt: existingLevel } to match the logic for counting total admins later
    const admins = await Admin.find({
      _id: { $ne: adminId }
    })
      .select("-password -__v")
      .skip(skip)
      .limit(limit);

    // Change: Added check for admins.length === 0 to correctly handle the case where no admins are found
    if (!admins || admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No admins found",
      });
    }

    // Count the total number of admins with a higher level than the logged-in user
    // Change: Updated condition to { $gt: existingLevel } to match the logic for finding admins earlier
    const totalAdmins = await Admin.countDocuments({
      _id: { $ne: adminId },
    });

    return res.status(200).json({
      success: true,
      message:
        "Successfully retrieved all admins",
      data: admins,
      totalPages: Math.ceil(totalAdmins / limit),
      currentPage: page,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving admins",
    });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const {superadminId, Id } = req.query;
    if(!superadminId){
      return res.status(400).json({
        success: false,
        message: "Superadmin ID is required",
      });}
    if(!Id){
      return res.status(400).json({
        success: false,
        message: "Admin ID is required",
      });
    }

    const loggedInUser = await Admin.findById(superadminId);
    if (!loggedInUser) {
      return res.status(404).json({
        success: false,
        message: "Superadmin not found",
      });
    }
    if(loggedInUser.role !== 'all'){
      return res.status(401).json({
        message: "You are not authorized",
        success: false,
      });
    }
    const admin = await Admin.findById(Id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }
    if (admin.isDeleted) {
      return res.status(400).json({
        success: false,
        message:
          "Account is already suspended",
      });
    }

    await Admin.findByIdAndUpdate(
      Id,
      { isDeleted: true },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Account suspended successfully",
    });
  } catch (error) {
    console.error("Error while deleting Admin:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.updateAdminPassword = async (req, res) => {
  try {
    const { adminId, username, password } = req.body;

    if(!adminId){
      return res.status(400).json({
        success: false,
        message: "Admin ID is required",
      });
    }
    else if(!username){
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }else if(!password){
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }
    else if (admin.isDeleted === true || admin.isActive === false) {
      return res.status(404).json({
        success: false,
        message:
          "Account is already suspended, kindly contact superadmin",
      });
    }else if(admin.username !== username){
      return res.status(404).json({
        success: false,
        message: "Please enter correct username",
      });
    }

    // Create an update object dynamically
    const updateData = {};
    if (password) {
      const hashedPassword = await bcryptjs.hash(password, 10);
      updateData.password = hashedPassword;
    }

    await Admin.findByIdAndUpdate(adminId, updateData, { new: true });

    return res.status(200).json({
      success: true,
      message: "Admin password updated successfully",
    });
  } catch (error) {
    console.error("Error while updating admin password:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errorMessage: error.message,
    });
  }
};

exports.changeStatus = async (req, res) => {
  const {superadminId, Id } = req.query;

  try {
    if(!superadminId){
      return res.status(400).json({
        success: false,
        message: "Superadmin ID is required",
      });
    }else if(!Id){
      return res.status(400).json({
        success: false,
        message: "Admin ID is required",
      });
    }
    
    const loggedInUser = await Admin.findById(superadminId);
    if (!loggedInUser) {
      return res.status(404).json({
        success: false,
        message: "Superadmin not found",
      });
    }
    if(loggedInUser.role !== 'all'){
      return res.status(401).json({
        message: "You are not authorized",
        success: false,
      });
    }
    const admin = await Admin.findById(Id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const updatedStatus = !admin.isActive;

    await Admin.findByIdAndUpdate(
      Id,
      { isActive: updatedStatus },
      { new: true }
    );

    const message = updatedStatus
      ? "Account activated successfully"
      : "Account blocked successfully";
    return res.status(200).json({
      success: true,
      message: message,
    });
  } catch (error) {
    console.error("Error while changing admin status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update the status",
    });
  }
};
