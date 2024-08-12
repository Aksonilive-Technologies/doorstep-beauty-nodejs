const Product = require("../models/productModel");
const mongoose = require("mongoose");
const { cloudinary } = require("../config/cloudinary.js");

// Helper function for validating product input
const validateProductInput = (productData, file) => {
  const { name, price, duration, categoryId } = productData;

  if (!name) return "Please fill the name field";
  if (!price) return "Please fill the price field";
  if (!duration) return "Please fill the duration field";
  if (!categoryId) return "Please fill the category field";

  if (!mongoose.Types.ObjectId.isValid(categoryId))
    return "Invalid category ID";

  return null;
};

exports.createProduct = async (req, res) => {
  const productData = req.body;
  const { file } = req;

  // Validate product input
  const validationError = validateProductInput(productData);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const existingProduct = await Product.findOne({ name: productData.name });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: `Product with name ${productData.name} already exists`,
      });
    }

    // Upload the image to Cloudinary if a file is present
    let imageUrl;
    if (file) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "product",
          public_id: `${Date.now()}_${file.originalname.split(".")[0]}`,
          overwrite: true,
        });
        imageUrl = result.secure_url;
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Error uploading image",
          errorMessage: error.message,
        });
      }
    }

    // Create a new product with the image URL if available
    const product = new Product({ ...productData, image: imageUrl });
    const savedProduct = await product.save();

    if (!savedProduct) {
      return res
        .status(500)
        .json({ success: false, message: "Error creating product" });
    }

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: savedProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error); // Log the error for debugging
    res.status(500).json({
      success: false,
      message: "Error creating product",
      errorMessage: error.message,
    });
  }
};

// Fetch all products
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Calculate the number of products to skip based on the current page and limit
    const skip = (page - 1) * limit;

    // Fetch products with pagination and sorting
    const products = await Product.find()
      .select("-__v")
      .skip(skip)
      .limit(parseInt(limit));

    // Get the total count of products for pagination calculation
    const totalProducts = await Product.countDocuments();

    res.status(200).json({
      success: true,
      message: "All products fetched successfully",
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
      },
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
    const { page = 1, limit = 10 } = req.query;

    // Calculate the number of products to skip based on the current page and limit
    const skip = (page - 1) * limit;

    // Fetch products with pagination and sorting
    const products = await Product.find({
      isnew: true,
    })
      .select("-__v")
      .skip(skip)
      .limit(parseInt(limit));

    // Get the total count of new products for pagination calculation
    const totalNewProducts = await Product.countDocuments({
      isnew: true,
    });

    res.status(200).json({
      success: true,
      message: "All new products fetched successfully",
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalNewProducts / limit),
        totalNewProducts,
      },
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
    if (!id) {
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

    // Handle image upload if a file is provided
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "product",
          public_id: `${Date.now()}_${req.file.originalname.split(".")[0]}`,
          overwrite: true,
        });
        updatedFields.image = result.secure_url;  // Add the image URL to the updated fields
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Error uploading image",
          errorMessage: error.message,
        });
      }
    }

    // Update the product in the database
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      { new: true }
    );

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
    if (!id) {
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

    const deletedProduct = await Product.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

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

    // if (product.isDeleted) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Product not found",
    //   });
    // }

    // if (!product.isActive) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Product not found",
    //   });
    // }

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

//change status by ID
exports.changeStatusById = async (req, res) => {
  const { id } = req.query;

  try {
    const product = await Product.findById(id).select("-__v");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Toggle the isActive status
    product.isActive = !product.isActive;
    await product.save();

    res.status(200).json({
      success: true,
      message: `Product is now ${product.isActive ? "Active" : "Deactivated"}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error changing status",
      errorMessage: error.message,
    });
  }
};
