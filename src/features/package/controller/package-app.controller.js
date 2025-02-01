const Package = require("../model/package.model");
const mongoose = require("mongoose");

// Helper function for validating package input
const validatePackageInput = (packageData) => {
  const { name, price, duration, categoryId, productIds } = packageData;

  if (!name) return "Please fill the name field";
  if (!price) return "Please fill the price field";
  if (!duration) return "Please fill the duration field";
  if (!categoryId) return "Please fill the category field";
  if (!productIds || !productIds.length)
    return "Please provide at least one product";

  if (!mongoose.Types.ObjectId.isValid(categoryId))
    return "Invalid category ID";
  for (let id of productIds) {
    if (!mongoose.Types.ObjectId.isValid(id)) return "Invalid product ID(s)";
  }

  return null;
};

// Create a Package
exports.createPackage = async (req, res) => {
  const packageData = req.body;

  // Validate package input
  const validationError = validatePackageInput(packageData);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const existingPackage = await Package.findOne({
      name: packageData.name,
      isActive: true,
      isDeleted: false,
    });

    if (existingPackage) {
      return res.status(400).json({
        success: false,
        message: "Package with name " + packageData.name + " already exists",
      });
    }

    const package = new Package(packageData);
    const savedPackage = await package.save();

    if (!savedPackage) {
      return res
        .status(500)
        .json({ success: false, message: "Error creating package" });
    }

    res.status(201).json({
      success: true,
      message: "Package created successfully",
      package: savedPackage,
    });
  } catch (error) {
    console.error("Error creating package:", error);
    res.status(500).json({
      success: false,
      message: "Error creating package",
      errorMessage: error.message,
    });
  }
};

// Get All Packages
exports.getAllPackages = async (req, res) => {
  try {
    // Get the page and limit from query parameters
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to limit of 10 if not provided
    const skip = (page - 1) * limit; // Calculate how many documents to skip

    // Fetch packages with pagination
    const packages = await Package.find({
      isActive: true,
      isDeleted: false,
    })
      .skip(skip) // Skip the calculated number of documents
      .limit(limit) // Limit the number of documents returned
      .select("-__v");

    // Count total packages for pagination metadata
    const totalPackages = await Package.countDocuments({
      isActive: true,
      isDeleted: false,
    });

    const totalPages = Math.ceil(totalPackages / limit); // Calculate total pages

    res.status(200).json({
      success: true,
      message: "All packages fetched successfully",
      data: packages,
      pagination: {
        totalPackages,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching packages",
      errorMessage: error.message,
    });
  }
};

// Update a Package
exports.updatePackage = async (req, res) => {
  const { id } = req.query;
  const packageData = req.body;

  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Package ID is required",
      });
    }

    const package = await Package.findById(id);

    if (!package) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    // Update only the fields that are provided
    const updatedFields = {};
    for (let key in packageData) {
      if (packageData[key] !== undefined) {
        updatedFields[key] = packageData[key];
      }
    }

    const updatedPackage = await Package.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      { new: true }
    );

    if (!updatedPackage) {
      return res.status(500).json({
        success: false,
        message: "Error updating package",
      });
    }

    res.status(200).json({
      success: true,
      message: "Package updated successfully",
      data: updatedPackage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating package",
      errorMessage: error.message,
    });
  }
};

// Delete a Package
exports.deletePackage = async (req, res) => {
  const { id } = req.query;

  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Package ID is required",
      });
    }

    const package = await Package.findById(id);

    if (!package) {
      return res.status(404).json({
        success: false,
        message: "Package not found with Id " + id,
      });
    }

    if (package.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Package already deleted",
      });
    }

    const deletedPackage = await Package.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!deletedPackage) {
      return res.status(500).json({
        success: false,
        message: "Error deleting package",
      });
    }

    res.status(200).json({
      success: true,
      message: "Package deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting package",
      errorMessage: error.message,
    });
  }
};

// Get Package by ID
exports.getPackageById = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Package ID is required",
    });
  }

  try {
    const package = await Package.findById(id).select("-__v");

    if (!package) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    if (package.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    if (!package.isActive) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Package fetched successfully",
      data: package,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching package",
      errorMessage: error.message,
    });
  }
};

exports.getPackageByCategoryId = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Category ID is required",
    });
  }

  try {
    const package = await Package.find({
      categoryId: id,
      isDeleted: false,
      isActive: true,
    }).select("-__v ");
    // console.log(package, "package");
    if (!package) {
      return res.status(404).json({
        success: false,
        message:
          "Package not found with category Id " +
          id +
          "it may be deleted or inactive",
      });
    }
    res.status(200).json({
      success: true,
      message: "Package fetched successfully",
      data: package,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching package",
      errorMessage: error.message,
    });
  }
};
