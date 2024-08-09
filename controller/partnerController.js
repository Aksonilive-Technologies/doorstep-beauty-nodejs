const Partner = require("../models/partnerModel.js");

//register the partner
const validationRules = {
    name: "Please fill the name",
    email: "Please fill the email",
    phone: {
      message: "Please fill the mobile number",
      length: 10,
      lengthError: "Mobile number must have 10 digits"
    },
    address: "Please fill the address field",
  };
  
  // Validate user input
  const validateUserInput = (input) => {
    // Check for missing fields
    for (const [key, rule] of Object.entries(validationRules)) {
      if (typeof rule === 'string') {
        if (!input[key]) {
          return rule;
        }
      } else if (typeof rule === 'object') {
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
    const { name, email, phone, address } = req.body;
  
    // Validate user input
    const validationError = validateUserInput({ name, email, phone, address });
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }
  
    try {
      // Check if email already exists
      const existingUser = await Partner.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Email already registered" });
      }
  
      // Create a new partner
      const user = new Partner({ name, email, phone, address });
      await user.save();
  
      res.status(201).json({
        success: true,
        message: "Partner created successfully",
      });
    } catch (error) {
      console.error('Error creating partner:', error); // Log the error for debugging
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
    const partners = await Partner.find(); // Removed .populate("user")
    res.status(200).json({
      success: true,
      message: "Partners retrieved successfully",
      data: partners,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching partners",
      errorMessage: error.message,
    });
  }
};

//update partner
exports.updatePartner = async (req, res) => {
  const { id } = req.query;
  const { name, email, phone, address } = req.body;

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

   const partnerUpdated = await Partner.findByIdAndUpdate(
      id,
      { name, email, phone, address },
      { new: true }
    );

    if (!partnerUpdated) {
      return res.status(500).json({
        success: false,
        message: "Error updating partner",
      });
    }

    res.status(200).json({
      success: true,
      message: "Partner updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating partner",
      errorMessage: error.message,
    });
  }
};

//delete partner


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
          message: "Your account is already deleted. Please contact the support team for assistance.",
        });
      }
  
      // if (!partner.isActive) {
      //   return res.status(400).json({
      //     success: false,
      //     message: "Your account is currently inactive.",
      //   });
      // }
  
      // Mark the partner as deleted
      const partnerDeleted = await Partner.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  
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
      console.error('Error deleting partner:', error); // Log the error for debugging
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
  