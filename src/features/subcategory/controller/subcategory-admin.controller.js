const Subcategory = require("../model/subcategory.model.js");
const { cloudinary } = require("../../../../config/cloudinary.js");
const XLSX = require("xlsx");

// Create a new Subcategory
exports.createSubcategory = async (req, res) => {
  const { name, image, position, parentCategory } = req.body;

  const requiredFields = { name, position, parentCategory };

  for (const [key, value] of Object.entries(requiredFields)) {
    if (!value) {
      return res.status(400).json({
        success: false,
        message: `${key} is required`,
      });
    }
  }

  try {

    // Check for existing subcategory
    const existingSubcategory = await Subcategory.findOne({ name });

    if (existingSubcategory) {
      return res.status(400).json({
        success: false,
        message: "Subcategory already exists",
      });
    }

    // Create and save the new subcategory
    // Upload the image to Cloudinary if a file is present
    let imageUrl;
    if (req.file) {
      const baseFolder = process.env.CLOUDINARY_BASE_FOLDER || "";

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: baseFolder + "subcategory",
        public_id: `${Date.now()}_${req.file.originalname.split(".")[0]}`,
        overwrite: true,
      });
      imageUrl = result.secure_url;
    }
    const subcategory = new Subcategory({ name, image: imageUrl, position, parentCategory });
    await subcategory.save();

    res.status(201).json({
      success: true,
      message: "Subcategory created successfully",
    });
  } catch (error) {
    console.error("Error creating subcategory:", error);
    res.status(500).json({
      success: false,
      message: "Error creating subcategory",
      errorMessage: error.message,
    });
  }
};

// Get all Subcategories
exports.getAllSubcategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find subcategories with pagination
    const subcategories = await Subcategory.find()
      .select("-__v")
      .sort({ position: 1 }) // Sort by position in ascending order
      .skip(skip)
      .limit(limit);

    // Get the total number of subcategories (for pagination info)
    const totalSubcategories = await Subcategory.countDocuments();
    const totalPages = Math.ceil(totalSubcategories / limit);

    res.status(200).json({
      success: true,
      message: "Subcategories retrieved successfully",
      data: subcategories,
      currentPage: page,
      totalPages: totalPages,
      totalCategories: totalSubcategories,
    });
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching subcategories",
      errorMessage: error.message,
    });
  }
};

// Update a Subcategory by ID
exports.updateSubcategory = async (req, res) => {
  const { id } = req.query; // Using query parameters instead of params
  const updates = req.body;

  try {
    const subcategory = await Subcategory.findById(id);

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    // If there's a new image, upload it and add the URL to the updates
    if (req.file) {
      const baseFolder = process.env.CLOUDINARY_BASE_FOLDER || "";

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: baseFolder + "subcategory",
        public_id: `${Date.now()}_${req.file.originalname.split(".")[0]}`,
        overwrite: true,
      });
      updates.image = result.secure_url; // Add the image URL to the updates
    }

    const updatedSubcategory = await Subcategory.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!updatedSubcategory) {
      return res.status(500).json({
        success: false,
        message: "Error updating subcategory",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subcategory updated successfully",
      data: updatedSubcategory,
    });
  } catch (error) {
    console.error("Error updating subcategory:", error);
    res.status(500).json({
      success: false,
      message: "Error updating subcategory",
      errorMessage: error.message,
    });
  }
};

// Soft delete a Subcategory by ID
exports.deleteSubcategory = async (req, res) => {
  //yaha pe query likhna hai params ke jagah pe
  // const { id } = req.params;
  const { id } = req.query;
  console.log("id : ", id);
  try {
    const subcategory = await Subcategory.findById(id);

    subcategory.isDeleted = true;
    const deletedSubcategory = await subcategory.save();

    if (!deletedSubcategory) {
      return res.status(500).json({
        success: false,
        message: "Error deleting subcategory",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subcategory deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting subcategory:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting subcategory",
      errorMessage: error.message,
    });
  }
};

//change status of active
exports.changeStatus = async (req, res) => {
  const { id } = req.query;

  try {
    // Find the subcategory by ID
    const subcategory = await Subcategory.findById(id);
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    // Toggle the isActive status
    subcategory.isActive = !subcategory.isActive;

    // Save the updated subcategory
    const updatedSubcategory = await subcategory.save();

    // Send success response
    res.status(200).json({
      success: true,
      message: subcategory.isActive
        ? "Your subcategory is activated"
        : "Your subcategory is deactivated",
    });
  } catch (error) {
    // Handle errors
    console.error("Error updating subcategory status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating subcategory status",
      errorMessage: error.message,
    });
  }
};

exports.downloadExcelSheet = async (req, res) => {
  try {
    // Step 1: Fetch data from MongoDB
    const subcategories = await Subcategory.find().populate("parentCategory", "name");

    // Step 2: Prepare the data for Excel
    const data = subcategories.map((subcategory) => ({
      Name: subcategory.name,
      Image: subcategory.image,
      ParentCategory: subcategory.parentCategory.name,
      Position: subcategory.position,
      IsActive: subcategory.isActive ? "Active" : "Inactive",
      IsDeleted: subcategory.isDeleted ? "Deleted" : "Not Deleted",
      CreatedAt: subcategory.createdAt.toISOString(),
      UpdatedAt: subcategory.updatedAt.toISOString(),
    }));

    // Step 3: Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Subcategories");

    // Step 4: Generate the Excel file as a buffer (in-memory)
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    // Step 5: Set the appropriate headers for file download
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=subcategories.xlsx"
    );
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

exports.searchSubcategory = async (req, res) => {
  try {
    const { query } = req.query;

    // Handle pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Define search conditions using case-insensitive regex for 'name'
    // and exact or number conversion for 'position'
    let searchCondition = {};

    if (query) {
      const isNumericQuery = !isNaN(query);
      searchCondition = {
        $or: [
          { name: { $regex: query, $options: "i" } }, // Case-insensitive search for name
          ...(isNumericQuery ? [{ position: parseInt(query, 10) }] : []), // Exact match for numeric position
        ],
      };
    }

    // Find the subcategories matching the search condition
    const subcategories = await Subcategory.find(searchCondition)
      .limit(limit)
      .skip(skip)
      .lean();

    // Check if no subcategories are found
    if (subcategories.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No data found",
      });
    }

    const totalSubcategories = await Subcategory.countDocuments(searchCondition);

    // Return the search results along with pagination details
    res.status(200).json({
      success: true,
      message: "Subcategories retrieved successfully",
      data: subcategories,
      totalSubcategories,
      totalPages: Math.ceil(totalSubcategories / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error while searching subcategories:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while searching subcategories",
      errorMessage: error.message,
    });
  }
};
