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
  console.log("Received body:", req.body);

  // Validate user input
  const validationError = validateUserInput({ name, email, phone, address });
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
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
      // Check if the pincode exists in the ServiceablePincode collection
      let serviceablePincode = await ServiceablePincode.findOne({
        pincode: pin,
      });

      // If the pincode doesn't exist, create a new pincode document
      serviceablePincode = new ServiceablePincode({
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
      .skip((page - 1) * limit);

    const totalPartners = await Partner.countDocuments();

    res.status(200).json({
      success: true,
      message: "Partners retrieved successfully",
      data: partners,
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
  const { name, email, phone, address } = req.body;
  const file = req.file;

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

    let updateData = { name, email, phone, address };

    // Handle image upload if a new file is provided
    if (file) {
      try {
        // Delete the old image from Cloudinary if it exists
        if (partner.image) {
          const publicId = partner.image.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        }

        // Upload the new image
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "partners",
          public_id: `${Date.now()}_${name}`,
          overwrite: true,
        });

        updateData.image = result.secure_url;
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Error uploading image",
          errorMessage: uploadError.message,
        });
      }
    }

    const partnerUpdated = await Partner.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!partnerUpdated) {
      return res.status(500).json({
        success: false,
        message: "Error updating partner",
      });
    }

    res.status(200).json({
      success: true,
      message: "Partner updated successfully",
      data: partnerUpdated,
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
