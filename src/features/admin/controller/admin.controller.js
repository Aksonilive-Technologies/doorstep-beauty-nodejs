import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../model/admin.model.js";
import mongoose from "mongoose";
import XLSX from "xlsx";

export const register = async (req, res) => {
  const { name, username, password, email, role } = req.body;
  const { adminId } = req.query;

  try {
    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "Admin ID is missing",
      });
    }

    const admin = await Admin.findById(adminId);
    if (!admin || admin.role !== "all") {
      return res.status(admin ? 401 : 404).json({
        success: false,
        message: admin ? "You are not authorized" : "Admin not found",
      });
    }

    const requiredFields = { name, username, password, email, role };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        return res.status(400).json({
          success: false,
          message: `Please fill ${key}`,
        });
      }
    }

    const [existingAdminUser, existingAdminEmail] = await Promise.all([
      Admin.findOne({ username }),
      Admin.findOne({ email }),
    ]);

    if (existingAdminUser || existingAdminEmail) {
      return res.status(400).json({
        success: false,
        message: existingAdminUser
          ? "Username already exists"
          : "Email already exists",
      });
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
    return res.status(201).json({
      success: true,
      message: "Admin registered successfully",
    });
  } catch (error) {
    console.error("Error while registering Admin:", error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while registering admin",
    });
  }
};

export const registerSuperadmin = async (req, res) => {
  const { name, username, password, email } = req.body;

  const requiredFields = { name, username, password, email };
  for (const [key, value] of Object.entries(requiredFields)) {
    if (!value) {
      return res.status(400).json({
        success: false,
        message: `${key} is required`,
      });
    }
  }

  try {
    const [existingAdminUser, existingAdminEmail] = await Promise.all([
      Admin.findOne({ username }),
      Admin.findOne({ email }),
    ]);

    if (existingAdminUser || existingAdminEmail) {
      return res.status(400).json({
        success: false,
        message: existingAdminUser
          ? "Username already exists"
          : "Email already exists",
      });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const newAdmin = new Admin({
      name,
      username,
      password: hashedPassword,
      email,
      role: "all",
    });

    await newAdmin.save();
    return res.status(201).json({
      success: true,
      message: "Admin registered successfully",
    });
  } catch (error) {
    console.error("Error while registering superadmin:", error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while registering superadmin",
    });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: !username ? "Please fill username" : "Please fill password",
    });
  }

  try {
    const admin = await Admin.findOne({ username });
    if (!admin || !(await bcryptjs.compare(password, admin.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }
    if (!admin.isActive || admin.isDeleted) {
      return res.status(403).json({
        success: false,
        message: admin.isDeleted
          ? "Your account is suspended, please contact superadmin."
          : "Your account is inactive, please contact superadmin.",
      });
    }

    const token = jwt.sign({ AdminId: admin._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    return res.status(200).json({
      success: true,
      message: "Admin logged in successfully",
      data: {
        id: admin._id,
        name: admin.name,
        username: admin.username,
        token,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Error while logging in:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const allAdmin = async (req, res) => {
  const { adminId, query } = req.query;

  try {
    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "Admin ID is required",
      });
    }

    const loggedInUser = await Admin.findById(adminId);
    if (!loggedInUser) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (loggedInUser.role !== "all") {
      return res.status(401).json({
        success: false,
        message: "You are not authorized to view this page",
      });
    }

    // Handle pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    //search condition
    const searchCondition = query
      ? { role: { $ne: "all"}, isDeleted: false, name: { $regex: query, $options: "i" } }
      : { role: { $ne: "all"}, isDeleted: false };

    // Retrieve admins excluding the logged-in admin, with pagination
    const admins = await Admin.find(searchCondition)
      .select("-password -__v")
      .skip(skip)
      .limit(limit);

    // if (admins.length === 0) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "No admins found",
    //   });
    // }

    const totalAdmins = admins.length;

    return res.status(200).json({
      success: true,
      message: "Successfully retrieved all admins",
      data: admins,
      totalPages: Math.ceil(totalAdmins / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error while retrieving admins:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving admins",
    });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const { superadminId, Id } = req.query;

    if (!superadminId || !Id) {
      return res.status(400).json({
        success: false,
        message: !superadminId
          ? "Superadmin ID is required"
          : "Admin ID is required",
      });
    }

    const loggedInUser = await Admin.findById(superadminId);
    if (!loggedInUser || loggedInUser.role !== "all") {
      return res.status(loggedInUser ? 401 : 404).json({
        success: false,
        message: loggedInUser
          ? "You are not authorized"
          : "Superadmin not found",
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
        message: "Account is already suspended",
      });
    }

    await Admin.findByIdAndUpdate(Id, { isDeleted: true }, { new: true });

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

export const updateAdminPassword = async (req, res) => {
  try {
    let { username, oldPassword, password } = req.body;

    if (!username || !oldPassword || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, oldPassword and password is required",
      });
    }

    const admin = await Admin.findOne({ username });

    if (!admin || !(await bcryptjs.compare(oldPassword, admin.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }
    if (admin.isDeleted || !admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is suspended, please contact superadmin",
      });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    await Admin.findOneAndUpdate(
      { username },
      { password: hashedPassword }
    );

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

export const changeStatus = async (req, res) => {
  const { superadminId, Id } = req.query;

  if (!superadminId || !Id) {
    return res.status(400).json({
      success: false,
      message: `${!superadminId ? "Superadmin ID" : "Admin ID"} is required`,
    });
  }

  try {
    const loggedInUser = await Admin.findById(superadminId);
    if (!loggedInUser || loggedInUser.role !== "all") {
      return res.status(loggedInUser ? 401 : 404).json({
        success: false,
        message: loggedInUser
          ? "You are not authorized"
          : "Superadmin not found",
      });
    }

    const admin = await Admin.findById(Id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    const message = admin.isActive
      ? "Account activated successfully"
      : "Account blocked successfully";
    return res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Error while changing admin status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update the status",
    });
  }
};

export const updateAdmin = async (req, res) => {
  const { superadminId, adminId} = req.query;
  const updates = req.body;

  if (!superadminId || !adminId) {
    return res.status(400).json({
      success: false,
      message: `${
        !superadminId ? "Superadmin ID" : "Admin ID"
      } is required`,
    });
  }

  try {
    const loggedInUser = await Admin.findById(superadminId);
    if (!loggedInUser || loggedInUser.role !== "all") {
      return res.status(loggedInUser ? 401 : 404).json({
        success: false,
        message: loggedInUser
          ? "You are not authorized"
          : "Superadmin not found",
      });
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(adminId, updates);

    if (!updatedAdmin) {
      return res.status(500).json({
        success: false,
        message: "Error updating admin",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin updated successfully",
    });
  } catch (error) {
    console.error("Error while updating admin:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errorMessage: error.message,
    });
  }
};

export const downloadExcelSheet = async (req, res) => {
  const { superadminId } = req.query;

  // Validate the presence of superadminId
  if (!superadminId) {
    return res.status(400).json({
      success: false,
      message: "Superadmin ID is required",
    });
  }

  try {
    // Step 1: Verify if the logged-in user is a SuperAdmin or has role 'all'
    const loggedInUser = await Admin.findById(superadminId);

    // Check if the user exists and has the appropriate role
    if (!loggedInUser || loggedInUser.role !== "all") {
      return res.status(loggedInUser ? 401 : 404).json({
        success: false,
        message: loggedInUser
          ? "You are not authorized to download this file"
          : "Superadmin not found",
      });
    }

    // Step 2: Fetch the admin data from MongoDB
    const admins = await Admin.find({ isDeleted: false });

    // Step 3: Prepare the data for Excel
    const data = admins.map((admin) => ({
      Name: admin.name,
      Username: admin.username,
      Email: admin.email,
      Role: admin.role,
      IsActive: admin.isActive ? "Active" : "Inactive",
      CreatedAt: admin.createdAt.toISOString(),
      UpdatedAt: admin.updatedAt.toISOString(),
    }));

    // Step 4: Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Admins");

    // Step 5: Generate the Excel file as a buffer (in-memory)
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    // Step 6: Set the appropriate headers for file download
    res.setHeader("Content-Disposition", "attachment; filename=admins.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Step 7: Send the buffer as the response
    res.send(excelBuffer);
  } catch (error) {
    console.error("Error generating Excel file:", error);
    return res.status(500).json({
      success: false,
      message: "Error generating Excel file",
    });
  }
};
