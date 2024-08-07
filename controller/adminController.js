const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel.js");
const mongoose = require("mongoose");

// Admin Registration
exports.register = async (req, res) => {
  const { name, username, password } = req.body;
  const { id } = req.query;

  const superAdmin = await Admin.findById(id);

  //check if any of one is not coming then return taht misssing thing
  if (!name) {
    return res
      .status(400)
      .json({ success: false, message: "Please fill name" });
  }
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
    // Check if username already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ success: false, message: "Username already exists" });
    }

    // Hash the password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create new admin
    const newAdmin = new Admin({
      name,
      username,
      password: hashedPassword,
      level: superAdmin.level + 1,
    });

    // Save the new admin to the database
    await newAdmin.save();
    // Generate JWT token
    const token = jwt.sign({ AdminId: newAdmin._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });
    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      token: token,
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
        message: "Your account is inactive, Please contact support team",
      });
    }
    if (admin.isDeleted === true) {
      return res.status(401).json({
        success: false,
        message: "Your account is deleted, Please contact support team",
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
  try {
    const loggedInUserId = req.userId; 

    if (!loggedInUserId) {
      return res.status(400).json({
        message: 'Logged-in user ID is missing',
        success: false,
      });
    }

    
    const admins = await Admin.find({ _id: { $ne: loggedInUserId } }).select("-password -__v");

    return res.status(200).json({
      success: true,
      message: "Successfully retrieved all admins excluding the logged-in user",
      data: admins,
    });
  } catch (error) {
    console.error("Error while fetching all admins:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};



exports.deleteAdmin = async (req, res) => {
  try {
    const id = req.query.id;
    const adminCheck = await Admin.findById(id);

    if (!adminCheck) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (adminCheck.isDeleted) {
      return res.status(400).json({
        success: false,
        message:
          "Account is already suspended, kindly contact the support team",
      });
    }

    const admin = await Admin.findByIdAndUpdate(
      id,
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

exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.query;
    const objectId = new mongoose.Types.ObjectId(id);
    console.log(objectId, typeof objectId);
    const checkAdmin = await Admin.find({_id:objectId});
    console.log(checkAdmin);
    if (checkAdmin.isDeleted === true) {
      return res.status(404).json({
        success: false,
        message:
          "Account is already suspended, kindly contact the support team",
      });
    }
    if (checkAdmin.isActive === false) {
      return res.status(404).json({
        success: false,
        message:
          "Account is temporarly blocked, kindly contact the support team",
      });
    }

    const { name, username, password } = req.body;

    // Create an update object dynamically
    const updateData = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (password) {
      const hashedPassword = await bcryptjs.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Update the admin
    const admin = await Admin.findByIdAndUpdate(id, updateData, { new: true });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin details updated successfully",
    });
  } catch (error) {
    console.error("Error while updating Admin:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errorMessage: error.message,
    });
  }
};

exports.changeStatus = async (req, res) => {
  const { id } = req.query;

  try {
    const admin = await Admin.findById(id);
    console.log("Admin: ", admin);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    let isActive = !admin.isActive;

    if (isActive === true) {
      isActive = false;
      await Admin.findByIdAndUpdate(id, { isActive }, { new: true });
      return res
        .status(200)
        .json({ success: true, message: "Account blocked successfully" });
    } else if (isActive === false) {
      isActive = true;
      await Admin.findByIdAndUpdate(id, { isActive }, { new: true });
      return res
        .status(200)
        .json({ success: true, message: "Account activated successfully" });
    }
  } catch (error) {
    console.error("Error while changing admin status:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while changing admin status",
    });
  }
};
