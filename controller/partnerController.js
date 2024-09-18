const Partner = require("../models/partnerModel.js");
const jwt = require("jsonwebtoken");
const generateCode = require("../helper/generateCode.js");
const generateRandomCode = require("../helper/generateCode.js");
const { cloudinary } = require("../config/cloudinary");
const Transaction = require("../models/transactionModel.js");
const ServicablePincode = require('../models/servicablePincodeModel');
//Create Register

exports.partnerById = async (req, res) => {
  const { id } = req.query;
  try {
    if (!id) {
      return res.status(404).json({
        success: false,
        message: "Partner ID is required.",
      });
    }
    const partner = await Partner.findById(id)
      .select("-__v");

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    if (partner.isDeleted === true) {
      return res.status(404).json({
        success: false,
        message: "Your account is deactivated, please contact the support team",
      });
    }
    if (partner.isActive === false) {
      return res.status(404).json({
        success: false,
        message: "Your account is suspended for now",
      });
    }

    res.status(200).json({
      success: true,
      message: "Partner fetched successfully",
      data: partner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching partner",
      errorMessage: error.message,
    });
  }
};

exports.checkExistance = async (req, res) => {
  const { mobile } = req.query;

  try {
    if (!mobile) {
      return res.status(404).json({
        success: false,
        message: "Mobile number is required",
      });
    }
    console.log(mobile);
    const partner = await Partner.findOne({ phone: mobile })
      .select("-__v");
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner with mobile number " + mobile + " not found",
      });
    }
    if (partner.isDeleted === true) {
      return res.status(404).json({
        success: false,
        message: "Your account is deactivated, please contact the support team",
      });
    }
    if (partner.isActive === false) {
      return res.status(404).json({
        success: false,
        message: "Your account is suspended for now",
      });
    }
    if (partner) {
      return res.status(200).json({
        success: true,
        message: "Partner is found",
        data: partner,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking partner existence",
      errorMessage: error.message,
    });
  }
};

exports.updatePartner = async (req, res) => {
  const { id, 
    } = req.body;
  const file = req.file; // Accessing the file from req.file

  console.log("Request received with body:", req.body);
  console.log("File received:", file);

  try {
    // Validate required fields
    if (!id) {
      console.log("Partner ID is missing");
      return res.status(400).json({
        success: false,
        message: "Partner ID is required",
      });
    }

    // Fetch the current partner details
    console.log("Fetching partner with ID:", id);
    const partner = await Partner.findById(id);

    if (!partner) {
      console.log("Partner not found for ID:", id);
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    // Check if the partner account is suspended or deactivated
    if (partner.isActive === false) {
      console.log("Partner account is suspended:", id);
      return res.status(403).json({
        success: false,
        message: "Your account is suspended for now",
      });
    }

    if (partner.isDeleted === true) {
      console.log("Partner account is deactivated:", id);
      return res.status(403).json({
        success: false,
        message: "Your account is deactivated, please contact the support team",
      });
    }

    // Create an object to hold the fields to update
    const updateFields = {};
    // if (name) updateFields.name = name;
    // if (email) updateFields.email = email;
    // if (mobile) updateFields.mobile = mobile;

    // Upload the image to Cloudinary if a file is present
    if (file) {
      console.log("Uploading file to Cloudinary:", file.filename);
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "partners",
          public_id: `${Date.now()}_${file.originalname.split(".")[0]}`,
          overwrite: true,
        });
        console.log("Image uploaded successfully:", result.secure_url);
        updateFields.image = result.secure_url; // Add the image URL to the updateFields object
      } catch (error) {
        console.error("Error uploading image to Cloudinary:", error.message);
        return res.status(500).json({
          success: false,
          message: "Error uploading image",
          errorMessage: error.message,
        });
      }
    }

    // Update the partner details
    console.log("Updating partner details for ID:", id);
    const partnerUpdated = await Partner.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!partnerUpdated) {
      console.log("Failed to update partner:", id);
      return res.status(500).json({
        success: false,
        message: "Error updating partner",
      });
    }

    console.log("Partner updated successfully:", partnerUpdated);
    res.status(200).json({
      success: true,
      message: "Partner updated successfully",
      data: partnerUpdated,
    });
  } catch (error) {
    console.error("Error updating partner:", error.message);
    res.status(500).json({
      success: false,
      message: "Error updating partner",
      errorMessage: error.message,
    });
  }
};