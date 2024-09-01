const CustomerAddress = require('../models/customerAddressModel'); // Adjust the path based on your directory structure
const Customer = require('../models/customerModel');

// Create a new customer address
exports.createAddress = async (req, res) => {
  const { customerId, address, addressType, isPrimary } = req.body;

  try {
    if (!customerId || !address || !addressType) {
      return res.status(400).json({
        success: false,
        message: "customerId, address, and addressType are required fields",
      });
    }

    const existingCustomer = await Customer.findOne({
      _id: customerId,
      isDeleted: false,
      isActive: true,
    });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found or deleted or inactive temporarily",
      });
    }

    const existingAddresses = await CustomerAddress.find({
      customer: customerId,
      isDeleted: false,
      isActive: true,
    });

    let primaryStatus = isPrimary;
    if (existingAddresses.length === 0) {
      primaryStatus = true; // Set as primary if no addresses exist
    } else if (primaryStatus) {
      // If isPrimary is true, update all other addresses to not be primary
      await CustomerAddress.updateMany(
        { customer: customerId, isPrimary: true, isDeleted: false, isActive: true },
        { isPrimary: false }
      );
    }

    const newAddress = new CustomerAddress({
      customer: customerId,
      address,
      addressType,
      isPrimary: primaryStatus || false, 
    });

    const savedAddress = await newAddress.save();

    res.status(201).json({
      success: true,
      message: "Customer address added successfully",
      data: savedAddress,
    });
  } catch (error) {
    console.error("Error creating customer address:", error);
    res.status(500).json({
      success: false,
      message: "Error creating customer address",
      errorMessage: error.message,
    });
  }
};


// Get all addresses for a customer
exports.getAddressesByCustomer = async (req, res) => {
  const { customerId } = req.query;
  try {
    const addresses = await CustomerAddress.find({ customer: customerId, isDeleted: false , isActive: true }).select("-isDeleted -isActive -__v -createdAt -updatedAt");

    if (!addresses || addresses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No addresses found for this customer",
      });
    } 

    res.status(200).json({
      success: true,
      message: "Customer addresses fetched successfully",
      data: addresses,
    });
  } catch (error) {
    console.error("Error fetching customer addresses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching customer addresses",
      errorMessage: error.message,
    });
  }
};

// Get a single customer address by ID
exports.getAddressById = async (req, res) => {
  const { addressId } = req.query;

  try {
    const address = await CustomerAddress.findById(addressId);

    if (!address || address.isDeleted || !address.isActive) {
      return res.status(404).json({
        success: false,
        message: "Address not found or deleted or deactivated temporarily",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer address fetched successfully",
      data: address,
    });
  } catch (error) {
    console.error("Error fetching customer address:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching customer address",
      errorMessage: error.message,
    });
  }
};

// Update a customer address
exports.updateAddress = async (req, res) => {
    const { addressId, address, addressType, isPrimary } = req.body;
  
    try {
      // Validate required fields
      if (!addressId) {
        return res.status(400).json({
          success: false,
          message: "addressId is required",
        });
      }
  
      // Fetch the current address details
      const currentAddress = await CustomerAddress.findById(addressId);
  
      if (!currentAddress) {
        return res.status(404).json({
          success: false,
          message: "Address not found",
        });
      }
  
      // Prepare the update object
      const updateFields = {};
  
      // Update address fields if provided
      if (address) {
        updateFields.address = {
          ...currentAddress.address, // Preserve existing fields
          ...address // Override with provided fields
        };
      }
  
      // Update other fields if provided
      if (addressType) updateFields.addressType = addressType;
      if (isPrimary !== undefined) updateFields.isPrimary = isPrimary;
  
      // If the address is set as primary, ensure no other addresses for the same customer are primary
      if (isPrimary) {
        await CustomerAddress.updateMany(
          { customer: currentAddress.customer, isPrimary: true, isDeleted: false, isActive: true, _id: { $ne: addressId } },
          { isPrimary: false }
        );
      }
  
      // Update the address
      const updatedAddress = await CustomerAddress.findByIdAndUpdate(
        addressId,
        updateFields,
        { new: true, runValidators: true }
      );
  
      res.status(200).json({
        success: true,
        message: "Customer address updated successfully",
        data: updatedAddress
      });
    } catch (error) {
      console.error("Error updating customer address:", error);
      res.status(500).json({
        success: false,
        message: "Error updating customer address",
        errorMessage: error.message,
      });
    }
  };
  
  

// Delete (soft delete) a customer address
exports.deleteAddress = async (req, res) => {
  const { addressId } = req.query;

  try {
    // Find the address by ID
    const address = await CustomerAddress.findOne({ _id: addressId ,isDeleted: false });
    if(!address){
      return res.status(404).json({
        success: false,
        message: "Address not found or already deleted",
      })
    }
    if(address.isPrimary){
      return res.status(404).json({
        success: false,
        message: "Primary address cannot be deleted",
      })
    }
    const deletedAddress = await CustomerAddress.findByIdAndUpdate(
      addressId,
      { isDeleted: true},
      { new: true }
    );

    if (!deletedAddress) {
      return res.status(404).json({
        success: false,
        message: "Something went wrong.Address not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer address deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting customer address:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting customer address",
      errorMessage: error.message,
    });
  }
};

exports.getPrimaryAddress = async (req, res) => {
  const { customerId } = req.query;

  try {
    // Validate the customerId
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    const address = await CustomerAddress.findOne({ customer: customerId ,isDeleted: false, isPrimary: true });
    if(!address){
      return res.status(404).json({
        success: false,
        message: "Primary address not found",
      })
    }

    return res.status(200).json({
      success: true,
      message: "Primary address fetched successfully",
      data: {
        address,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
