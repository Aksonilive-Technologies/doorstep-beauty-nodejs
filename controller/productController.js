const Product = require("../models/productModel");
const mongoose = require("mongoose");

// Helper function for validating product input
const validateProductInput = (productData) => {
  const { name, price, duration , categoryId } = productData;

  if (!name) return "Please fill the name field";
  if (!price) return "Please fill the price field";
  if (!duration) return "Please fill the duration field";
  if (!categoryId) return "Please fill the category field";

  if (!mongoose.Types.ObjectId.isValid(categoryId)) return "Invalid category ID";

  return null;
};

// Create Product
exports.createProduct = async (req, res) => {
  const productData = req.body;

  // Validate product input
  const validationError = validateProductInput(productData);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const existingProduct = await Product.findOne({ name: productData.name , isActive: true, isDeleted: false });

    if (existingProduct) {
      return res.status(400).json({ success: false, message: "Product with name " + productData.name + " already exists" });
    }
    const product = new Product(productData);
    const savedProduct = await product.save();

    if (!savedProduct) {
      return res.status(500).json({ success: false, message: "Error creating product" });
    }


    res.status(201).json({
      success: true,
      message: "Product created successfully",
    });
  } catch (error) {
    console.error('Error creating product:', error); // Log the error for debugging
    res.status(500).json({ success: false, message: "Error creating product", errorMessage: error.message });
  }
};

// Fetch all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({isActive: true, isDeleted: false}).select("-__v");
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

exports.getAllNewProducts = async (req, res) => {
    try {
      const products = await Product.find({isActive: true, isDeleted: false , isnew: true}).select("-__v");
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

// Update product
exports.updateProduct = async (req, res) => {
    const { id } = req.query;
    const productData = req.body;
  
    try {
      // Validate product input
      if(!id){
        return res.status(400).json({
          success: false,
          message: "Product ID is required",
        });
      }
      const product = await Product.findById(id);
  
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }
  
      // Update only the fields that are provided
      const updatedFields = {};
      for (let key in productData) {
        if (productData[key] !== undefined) {
          updatedFields[key] = productData[key];
        }
      }
  
      const updatedProduct = await Product.findByIdAndUpdate(id, { $set: updatedFields }, { new: true });
  
      if (!updatedProduct) {
        return res.status(500).json({
          success: false,
          message: "Error updating product",
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: updatedProduct,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating product",
        errorMessage: error.message,
      });
    }
  };

// Delete product
exports.deleteProduct = async (req, res) => {
  const { id } = req.query;

  try {
    if(!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found with Id " + id,
      });
    }

    if (product.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Product already deleted",
      });
    }

    const deletedProduct = await Product.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

    if (!deletedProduct) {
      return res.status(500).json({
        success: false,
        message: "Error deleting product",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting product",
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
