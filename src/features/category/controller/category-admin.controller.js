import Category from "../model/category.model.js";
import { cloudinary } from "../../../../config/cloudinary.js";
import XLSX from "xlsx";

// Create a new category
export const createCategory = async (req, res) => {
  const { name, position } = req.body;
  // console.log(req.body);

  try {
    // Check for missing fields
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!position) {
      return res.status(400).json({
        success: false,
        message: "Position is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    // Check for existing category
    const existingCategory = await Category.findOne({ name });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    // Create and save the new category
    // Upload the image to Cloudinary if a file is present
    let imageUrl;
    if (req.file) {
      const baseFolder = process.env.CLOUDINARY_BASE_FOLDER || "";

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: baseFolder + "category",
        public_id: `${Date.now()}_${req.file.originalname.split(".")[0]}`,
        overwrite: true,
      });
      imageUrl = result.secure_url;
    }
    const category = new Category({ name, image: imageUrl, position });
    await category.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      success: false,
      message: "Error creating category",
      errorMessage: error.message,
    });
  }
};

// Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find categories with pagination
    const categories = await Category.find({isDeleted: false})
      .select("-__v")
      .sort({ position: 1 }) // Sort by position in ascending order
      .skip(skip)
      .limit(limit);

    // Get the total number of categories (for pagination info)
    const totalCategories = await Category.countDocuments();
    const totalPages = Math.ceil(totalCategories / limit);

    res.status(200).json({
      success: true,
      message: "Categories retrieved successfully",
      data: categories,
      currentPage: page,
      totalPages: totalPages,
      totalCategories: totalCategories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      errorMessage: error.message,
    });
  }
};

// Update a category by ID
export const updateCategory = async (req, res) => {
  const { id } = req.query; // Using query parameters instead of params
  const updates = req.body;

  try {
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // If there's a new image, upload it and add the URL to the updates
    if (req.file) {
      const baseFolder = process.env.CLOUDINARY_BASE_FOLDER || "";

      // Delete the existing image from Cloudinary
      const publicId = category.image.split("/").pop().split(".")[0]; // Extract public_id from URL
      await cloudinary.uploader.destroy(
        `${baseFolder}category/${publicId.replace(/%20/g, " ")}`
      );

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: baseFolder + "category",
        public_id: `${Date.now()}_${req.file.originalname.split(".")[0]}`,
        overwrite: true,
      });
      updates.image = result.secure_url; // Add the image URL to the updates
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!updatedCategory) {
      return res.status(500).json({
        success: false,
        message: "Error updating category",
      });
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      message: "Error updating category",
      errorMessage: error.message,
    });
  }
};

// Soft delete a category by ID
export const deleteCategory = async (req, res) => {
  //yaha pe query likhna hai params ke jagah pe
  // const { id } = req.params;
  const { id } = req.query;
  // console.log("id : ", id);
  try {
    const category = await Category.findById(id);
    // if (!category || category.isDeleted || !category.isActive) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Category not found",
    //   });
    // }

    category.isDeleted = true;
    const deletedCategory = await category.save();

    if (!deletedCategory) {
      return res.status(500).json({
        success: false,
        message: "Error deleting category",
      });
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting category",
      errorMessage: error.message,
    });
  }
};

//change status of active
export const changeStatus = async (req, res) => {
  const { id } = req.query;

  try {
    // Find the category by ID
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Toggle the isActive status
    category.isActive = !category.isActive;

    // Save the updated category
    const updatedCategory = await category.save();

    // Send success response
    res.status(200).json({
      success: true,
      message: updatedCategory.isActive
        ? "Your category is activated"
        : "Your category is deactivated",
    });
  } catch (error) {
    // Handle errors
    console.error("Error updating category status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating category status",
      errorMessage: error.message,
    });
  }
};

export const downloadExcelSheet = async (req, res) => {
  try {
    // Step 1: Fetch data from MongoDB
    const categories = await Category.find({});

    // Step 2: Prepare the data for Excel
    const data = categories.map((category) => ({
      Name: category.name,
      Image: category.image,
      Type: category.type,
      Position: category.position,
      IsActive: category.isActive ? "Active" : "Inactive",
      IsDeleted: category.isDeleted ? "Deleted" : "Not Deleted",
      CreatedAt: category.createdAt.toISOString(),
      UpdatedAt: category.updatedAt.toISOString(),
    }));

    // Step 3: Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Categories");

    // Step 4: Generate the Excel file as a buffer (in-memory)
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    // Step 5: Set the appropriate headers for file download
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=categories.xlsx"
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

export const searchCategory = async (req, res) => {
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

    // Find the categories matching the search condition
    const categories = await Category.find(searchCondition)
      .limit(limit)
      .skip(skip)
      .lean();

    // Check if no categories are found
    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No data found",
      });
    }

    const totalCategories = await Category.countDocuments(searchCondition);

    // Return the search results along with pagination details
    res.status(200).json({
      success: true,
      message: "Categories retrieved successfully",
      data: categories,
      totalCategories,
      totalPages: Math.ceil(totalCategories / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error while searching categories:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while searching categories",
      errorMessage: error.message,
    });
  }
};
