const Category = require("../model/category.model.js");
const Product = require("../../product/model/product.model.js");

// need to modify
exports.getAllCategories = async (req, res) => {
  try {
    // Find categories with pagination
    const categories = await Category.find({ isActive: true, isDeleted: false })
      .select("-__v")
      .sort({ position: 1 })
      .lean(); // Use lean for better performance

    // Populate each category with related products and packages
    for (const category of categories) {
      const products = await Product.find({
        categoryId: category._id,
        isDeleted: false,
        isActive: true,
      }).select("-__v")
      .sort({ position: 1 });
      category.products = products;
    }

    res.status(200).json({
      success: true,
      message: "All Categories retrieved successfully",
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories, products, and packages:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories, products, and packages",
      errorMessage: error.message,
    });
  }
};
