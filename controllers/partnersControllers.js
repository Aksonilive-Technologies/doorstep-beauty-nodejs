const Partner = require("../models/partnerModel.js");

//register the partner
const Register = async (req, res) => {
  const { name, email, phone, address } = req.body;

  // Validate all fields are present
  if (!name) {
    return res.status(400).json({ message: "Please fill the name" });
  }
  if (!email) {
    return res.status(400).json({ message: "Please fill the email" });
  }
  if (!phone) {
    return res.status(400).json({ message: "Please fill the mobile number" });
  }
  //check phone number length
  if (phone.length !== 10) {
    return res
      .status(400)
      .json({ message: "Mobile number must have 10 digits" });
  }
  if (!address) {
    return res.status(400).json({ message: "Please fill the address field" });
  }

  // Validate email format
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(email)) {
    return res.status(400).json({ message: "Invalid email" });
  }

  try {
    const existingUser = await Partner.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create a new user
    const user = new Partner({
      name,
      email,
      phone,
      address,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "Partner created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while creating the user",
      error: error.message,
    });
  }
};

//fetching all the partners
const getPartners = async (req, res) => {
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
      error: error.message,
    });
  }
};

//update partner
const updatePartner = async (req, res) => {
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

    await Partner.findByIdAndUpdate(
      id,
      { name, email, phone, address },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Partner updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating partner",
      error: error.message,
    });
  }
};

//delete partner
const deletePartner = async (req, res) => {
  const { id } = req.query;
  try {
    const partner = await Partner.findById(id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    if (partner.isDeleted) {
      return res.status(404).json({
        success: false,
        message:
          "Your account is already deleted. Please contact the support team for assistance.",
      });
    }

    if (!partner.isActive) {
      return res.status(404).json({
        success: false,
        message: "Your account is currently inactive.",
      });
    }

    await Partner.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

    return res.status(200).json({
      success: true,
      message: "Your account has been successfully deleted.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the partner.",
    });
  }
};

module.exports = {
  Register,
  getPartners,
  updatePartner,
  deletePartner,
};
