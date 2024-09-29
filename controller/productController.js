const Product = require("../models/productModel");
const mongoose = require("mongoose");
const { uploadOnCloudinary } = require("../utility/cloudinary");

// Fetch all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      isDeleted: false,
    }).select("-__v")
    .sort({ categoryId: 1 })
    .populate("categoryId", "name");

    // Step to group products by category
const groupedProducts = products.reduce((acc, product) => {
  // Get the category name from the populated `categoryId` field
  const categoryName = product.categoryId.name;

  // Find if the category already exists in the accumulator
  const categoryIndex = acc.findIndex((item) => item.category === categoryName);

  if (categoryIndex !== -1) {
    // If the category already exists, push the product into its products array
    acc[categoryIndex].products.push(product);
  } else {
    // If the category doesn't exist, create a new entry for this category
    acc.push({
      category: categoryName,
      products: [product],
    });
  }

  return acc;
}, []);
    res.status(200).json({
      success: true,
      message: "All products fetched successfully",
      data: groupedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      errorMessage: error.message,
    });
  }
};

exports.getAllNewProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      isDeleted: false,
      isnew: true,
    }).sort({ createdAt: -1 })
    .select("-__v")
    .limit(10);
    res.status(200).json({
      success: true,
      message: "All products fetched successfully",
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      errorMessage: error.message,
    });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Product ID is required",
    });
  }

  try {
    const product = await Product.findById(id).select("-__v");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      errorMessage: error.message,
    });
  }
};
