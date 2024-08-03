const Customer = require("../models/customersModel.js");
const jwt = require("jsonwebtoken");

//Create Register
const Register = async (req, res) => {
  const { name, email, phone, address } = req.body;

  // Validate all fields are present
  if (!name) {
    return res.status(400).json({ message: "Please fill the name field" });
  }
  if (!email) {
    return res.status(400).json({ message: "Please fill the email field" });
  }
  if (!phone) {
    return res.status(400).json({ message: "Please fill the phone field" });
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
    const existingUser = await Customer.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create a new user
    const user = new Customer({
      name,
      email,
      phone,
      address,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating user" });
  }
};

//fetch all the customers
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().select("-__v");
    res.status(200).json({
      success: true,
      message: "All customers are here",
      customers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching customers",
    });
  }
};

//update customer
const updateCustomer = async (req, res) => {
  const { id } = req.query;
  const { name, email, phone, address } = req.body;
  try {
    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (customer.isActive === false) {
      return res.status(404).json({
        success: false,
        message: "Your account is suspended for now",
      });
    }

    if (customer.isDeleted === true) {
      return res.status(404).json({
        success: false,
        message: "Your account is deactivated, please contact the support team",
      });
    }

    await Customer.findByIdAndUpdate(
      id,
      { name, email, phone, address },
      { new: true } // This returns the updated document
    );

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating customer",
    });
  }
};

//delete customer
const deleteCustomer = async (req, res) => {
  const { id } = req.query;
  try {
    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (customer.isDeleted) {
      return res.status(404).json({
        success: false,
        message:
          "Your account is already deleted. Please contact the support team for assistance.",
      });
    }

    if (!customer.isActive) {
      return res.status(404).json({
        success: false,
        message: "Your account is currently inactive.",
      });
    }

    await Customer.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

    return res.status(200).json({
      success: true,
      message: "Your account has been successfully deleted.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the customer.",
    });
  }
};

//change status of deleted customer
const changeStatusDeletedCustomer = async (req, res) => {
  const { id } = req.query;
  try {
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (customer.isActive === false) {
      customer.isActive = true;
      return res.status(404).json({
        success: true,
        message: "Your account is activated now",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while changing the status of the customer.",
    });
  }
};

module.exports = {
  Register,
  getAllCustomers,
  updateCustomer,
  deleteCustomer,
  changeStatusDeletedCustomer,
};
