const Category = require("../models/categoriesModel");

// Create a new category
exports.createCategory = async (req, res) => {
  const { name, image, position } = req.body;
  console.log(req.body);

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

    // Check for existing category
    const existingCategory = await Category.findOne({ name });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    // Create and save the new category
    const category = new Category({ name, image, position });
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
exports.getAllCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find categories with pagination
    const categories = await Category.find()
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

exports.getAllCategoriesCustomer = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find categories with pagination, filtering out deleted or inactive categories
    const categories = await Category.find({
      isDeleted: false,
      isActive: true,
    })
      .select("-__v")
      .sort({ position: 1 }) // Sort by position in ascending order
      .skip(skip)
      .limit(limit);

    // Get the total number of categories (for pagination info)
    const totalCategories = await Category.countDocuments({
      isDeleted: false,
      isActive: true,
    });
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


// Get a single category by ID
exports.getCategoryById = async (req, res) => {
  const { id } = req.query;

  try {
    const category = await Category.findById(id);
    res.status(200).json({
      success: true,
      message: "Category retrieved successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching category",
      errorMessage: error.message,
    });
  }
};

// Update a category by ID
exports.updateCategory = async (req, res) => {
  //yaha pe query likhna hai params ke jagah pe
  // const { id } = req.params;
  const { id } = req.query;
  const updates = req.body;

  try {
    const category = await Category.findById(id);

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
exports.deleteCategory = async (req, res) => {
  //yaha pe query likhna hai params ke jagah pe
  // const { id } = req.params;
  const { id } = req.query;
  console.log("id : ", id);
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
exports.changeStatus = async (req, res) => {
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
      message: category.isActive
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
