const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel.js");
const mongoose = require("mongoose");

exports.register = async (req, res) => {
  const { name, username, password, email, role } = req.body;
  const { id } = req.query;

  try {
    const superAdmin = await Admin.findById(id);
    if (!superAdmin) {
      return res
        .status(400)
        .json({ success: false, message: "SuperAdmin not found" });
    }

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
      level: superAdmin.level + 1,
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
        message: "Your account is inactive, please contact the support team.",
      });
    }
    if (admin.isDeleted === true) {
      return res.status(401).json({
        success: false,
        message: "Your account is suspended, please contact the support team.",
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
        message: "Logged-in user ID is missing",
        success: false,
      });
    }

    // Find the logged-in user's level
    const loggedInUser = await Admin.findById(loggedInUserId);
    if (!loggedInUser) {
      return res.status(404).json({
        message: "Logged-in user not found",
        success: false,
      });
    }

    const existingLevel = loggedInUser.level;
    console.log(existingLevel);

    // Handle pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Find admins with a lower level than the logged-in user, with pagination
    const admins = await Admin.find({
      _id: { $ne: loggedInUserId },
      level: { $gt: existingLevel }
    })
    .select("-password -__v")
    .skip(skip)
    .limit(limit);

    const totalAdmins = await Admin.countDocuments({
      _id: { $ne: loggedInUserId },
      level: { $lt: existingLevel }
    });

    return res.status(200).json({
      success: true,
      message: "Successfully retrieved all admins with a lower level than the logged-in user",
      data: admins,
      totalPages: Math.ceil(totalAdmins / limit),
      currentPage: page,
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
    const checkAdmin = await Admin.find({ _id: objectId });
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

    const { username, password } = req.body;

    // Create an update object dynamically
    const updateData = {};
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
    // Find the admin by ID
    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const updatedStatus = !admin.isActive;

    await Admin.findByIdAndUpdate(
      id,
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
