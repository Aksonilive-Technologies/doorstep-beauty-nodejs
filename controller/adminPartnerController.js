const { cloudinary } = require("../config/cloudinary.js");
const Partner = require("../models/partnerModel.js");
const ServiceablePincode = require("../models/servicablePincodeModel.js");

//register the partner
const validationRules = {
  name: "Please fill the name",
  email: "Please fill the email",
  phone: {
    message: "Please fill the mobile number",
    length: 10,
    lengthError: "Mobile number must have 10 digits",
  },
  address: "Please fill the address field",
};

// Validate user input
const validateUserInput = (input) => {
  // Check for missing fields
  for (const [key, rule] of Object.entries(validationRules)) {
    if (typeof rule === "string") {
      if (!input[key]) {
        return rule;
      }
    } else if (typeof rule === "object") {
      if (!input[key]) {
        return rule.message;
      }
      if (input[key].length !== rule.length) {
        return rule.lengthError;
      }
    }
  }

  // Validate email format
  const email = input.email;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (email && !emailRegex.test(email)) {
    return "Invalid email";
  }

  return null;
};

exports.register = async (req, res) => {
  const { name, email, phone, address, pincode } = req.body;

  // Validate user input
  const validationError = validateUserInput({ name, email, phone, address });
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }
  if (typeof pincode !== "string") {
    return res
      .status(400)
      .json({
        success: false,
        message: "Data type error: pincode must be a string.",
      });
  }
  if (pincode.includes(" ")) {
    return res
      .status(400)
      .json({ success: false, message: "Pincode must not contain spaces." });
  }

  try {
    // Check if email already exists
    const existingUser = await Partner.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    // need to approve
    // Upload the image to Cloudinary if present
    let imageUrl = undefined;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "partners",
        public_id: `${Date.now()}_${name}`,
        overwrite: true,
      });
      imageUrl = result.secure_url;
    }

    // Create a new partner
    const user = new Partner({
      name,
      email,
      phone,
      address,
      image: imageUrl || undefined,
    });
    await user.save();

    // Split the pincode string into an array
    const pincodes = pincode.split(",").map((pin) => pin.trim());

    for (const pin of pincodes) {
      //create a new pincode document
      const serviceablePincode = new ServiceablePincode({
        pincode: pin,
        partner: user._id,
      });
      await serviceablePincode.save();
    }

    res.status(201).json({
      success: true,
      message: "Partner created successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error creating partner:", error); // Log the error for debugging
    res.status(500).json({
      success: false,
      message: "An error occurred while creating the partner",
      errorMessage: error.message,
    });
  }
};

//fetching all the partners
exports.getPartners = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Default to page 1, limit 10

    const partners = await Partner.find()
      .limit(limit * 1) // Convert string to number
      .skip((page - 1) * limit)
      .lean();

    const totalPartners = await Partner.countDocuments();

    for (let i = 0; i < partners.length; i++) {
      const partner = partners[i];
      const serviceablePincodes = await ServiceablePincode.find({
        partner: partner._id,
      }).select("pincode -_id");
      // Generate a comma-separated string of pincodes
      partner.pincode = serviceablePincodes
        .map((pincode) => pincode.pincode)
        .join(",");
    }

    res.status(200).json({
      success: true,
      message: "Partners retrieved successfully",
      data: partners,
      totalPartners,
      totalPages: Math.ceil(totalPartners / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching partners",
      errorMessage: error.message,
    });
  }
};

exports.updatePartner = async (req, res) => {
  const { id } = req.query;
  const { name, email, phone, address, pincode } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Partner ID is required.",
    });
  }

  if (!name && !email && !phone && !address && !pincode) {
    return res.status(400).json({
      success: false,
      message: "Please provide at least one field to update.",
    });
  }
  if (typeof pincode !== "string") {
    return res
      .status(400)
      .json({
        success: false,
        message: "Data type error: pincode must be a string.",
      });
  }
  if (pincode.includes(" ")) {
    return res
      .status(400)
      .json({ success: false, message: "Pincode must not contain spaces." });
  }

  try {
    const partner = await Partner.findById(id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    if (partner.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your account is suspended",
      });
    }

    if (partner.isDeleted === true) {
      return res.status(403).json({
        success: false,
        message: "Your account is deactivated, please contact the support team",
      });
    }
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (Object.keys(updateData).length > 0) {
      const partnerUpdated = await Partner.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      if (!partnerUpdated) {
        return res.status(500).json({
          success: false,
          message: "Error updating partner details",
        });
      }
    }

    if (pincode) {
      try {
        const pincodes = pincode
          .split(",")
          .map((pin) => parseInt(pin.trim(), 10));
        const existingPincodes = await ServiceablePincode.find({
          partner: id,
        }).select("pincode _id");
        const existingPincodesArray = existingPincodes.map((p) => ({
          pincode: p.pincode,
          id: p._id,
        }));

        // Determine which pincodes need to be added
        const pincodesToAdd = pincodes.filter(
          (pin) =>
            !existingPincodesArray.some((existing) => existing.pincode === pin)
        );

        // Determine which pincodes need to be removed
        const pincodesToRemove = existingPincodesArray
          .filter((existing) => !pincodes.includes(existing.pincode))
          .map((existing) => existing.id);

        // Remove old pincodes
        if (pincodesToRemove.length > 0) {
          await ServiceablePincode.deleteMany({
            _id: { $in: pincodesToRemove },
          });
        }

        // Add new pincodes
        if (pincodesToAdd.length > 0) {
          const newPincodes = pincodesToAdd.map((pin) => ({
            pincode: pin,
            partner: id,
          }));
          await ServiceablePincode.insertMany(newPincodes);
        }
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Error updating pincode",
          errorMessage: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Partner updated successfully",
    });
  } catch (error) {
    console.error("Error updating partner:", error);
    res.status(500).json({
      success: false,
      message: "Error updating partner",
      errorMessage: error.message,
    });
  }
};
//delete
exports.deletePartner = async (req, res) => {
  const { id } = req.query;

  // Validate the presence of 'id'
  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Partner ID is required.",
    });
  }

  try {
    // Find the partner by ID
    const partner = await Partner.findById(id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    // Check if the partner is already deleted or inactive
    if (partner.isDeleted) {
      return res.status(400).json({
        success: false,
        message:
          "Your account is already deleted. Please contact the support team for assistance.",
      });
    }

    // if (!partner.isActive) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Your account is currently inactive.",
    //   });
    // }

    // Mark the partner as deleted
    const partnerDeleted = await Partner.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!partnerDeleted) {
      return res.status(500).json({
        success: false,
        message: "Error deleting partner",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Your account has been successfully deleted.",
    });
  } catch (error) {
    console.error("Error deleting partner:", error); // Log the error for debugging
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the partner.",
      errorMessage: error.message,
    });
  }
};

exports.changeStatus = async (req, res) => {
  const { id } = req.query;

  try {
    // Find the admin by ID
    const partner = await Partner.findById(id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    const updatedStatus = !partner.isActive;

    await Partner.findByIdAndUpdate(
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
    console.error("Error while changing partner status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update the status",
    });
  }
};

exports.downloadExcelSheet = async (req, res) => {
  try {
    // Step 1: Fetch data from MongoDB
    const partners = await Partner.find({ isDeleted: false });

    // Step 2: Prepare the data for Excel
    const data = partners.map((partner) => ({
      Name: partner.name,
      Email: partner.email,
      Phone: partner.phone,
      Address: partner.address,
      Rating: partner.rating,
      WalletBalance: partner.walletBalance,
      Active: partner.isActive ? "Active" : "Inactive",
      CreatedAt: partner.createdAt.toISOString(),
      UpdatedAt: partner.updatedAt.toISOString(),
    }));

    // Step 3: Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Partners");

    // Step 4: Generate the Excel file as a buffer (in-memory)
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    // Step 5: Set the appropriate headers for file download
    res.setHeader("Content-Disposition", "attachment; filename=partners.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Step 6: Send the buffer as the response
    res.send(excelBuffer);
  } catch (error) {
    res.status(500).json({ message: "Error generating Excel file", error });
  }
};
