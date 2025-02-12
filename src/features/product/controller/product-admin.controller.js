import * as Product from "../model/product.model.js";
import mongoose from "mongoose";
import { cloudinary } from "../../../../config/cloudinary.js";
import XLSX from "xlsx";

// Helper function for validating product input
const validateProductInput = (productData) => {
  const { name, price, duration, categoryId } = productData;

  if (!name) return "Please fill the name field";
  if (!price) return "Please fill the price field";
  if (!duration) return "Please fill the duration field";
  if (!categoryId) return "Please fill the category field";

  if (!mongoose.Types.ObjectId.isValid(categoryId))
    return "Invalid category ID";
  if (
    productData.subcategoryId &&
    !mongoose.Types.ObjectId.isValid(productData.subcategoryId)
  ) {
    return "Invalid subcategory ID";
  }

  return null;
};

export const createProduct = async (req, res) => {
  const productData = req.body;

  // Validate product input
  const validationError = validateProductInput(productData);
  if (validationError) {
    console.error("Validation error:", validationError);
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    // Upload the image to Cloudinary if a file is present
    let imageUrl;

    if (req.file) {
      const baseFolder = process.env.CLOUDINARY_BASE_FOLDER || "";
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: baseFolder + "product",
          public_id: `${Date.now()}_${req.file.originalname.split(".")[0]}`,
          overwrite: true,
        });
        imageUrl = result.secure_url;
      } catch (error) {
        console.error(`Error uploading image to Cloudinary:`, error.message);
        return res.status(500).json({
          success: false,
          message: "Error uploading image",
          errorMessage: error.message,
        });
      }
    }

    // Create a new product with the image URL if available
    const product = new Product({ ...productData, image: imageUrl });
    // console.log("Creating new product:", product);

    const savedProduct = await product.save();

    // console.log("Product created successfully:", savedProduct);
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

// This one is to update only single image
export const updateProduct = async (req, res) => {
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

    // Upload single image to Cloudinary if a file is present
    if (req.file) {
      try {
        const baseFolder = process.env.CLOUDINARY_BASE_FOLDER || "";

        // Delete the existing image from Cloudinary
        const publicId = product.image.split("/").pop().split(".")[0]; // Extract public_id from URL
        await cloudinary.uploader.destroy(
          `${baseFolder}product/${publicId.replace(/%20/g, " ")}`
        );

        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: baseFolder + "product",
          public_id: `${Date.now()}_${req.file.originalname.split(".")[0]}`,
          overwrite: true,
        });
        updatedFields["image"] = result.secure_url;
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Error uploading image",
          errorMessage: error.message,
        });
      }
    }
    let command = { $set: updatedFields };

    if (productData.subcategoryId === null) {
      // Remove the subcategoryId field completely
      delete updatedFields.subcategoryId;
      command["$unset"] = { subcategoryId: "" };
    }

    // Update the product in the database
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      command,

      { new: true }
    );

    updatedProduct.save();

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
export const deleteProduct = async (req, res) => {
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

//change status by ID
export const changeStatusById = async (req, res) => {
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

export const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Fetch products with pagination and sorting
    const products = await Product.find()
      .select("-__v")
      .populate("categoryId")
      .populate("subcategoryId")
      .sort({ position: 1 });
    // .skip(skip)
    // .limit(parseInt(limit));

    // Manually sort products based on category position first, then subcategory position (if present)
    products.sort((a, b) => {
      if (a.categoryId.position !== b.categoryId.position) {
        return a.categoryId.position - b.categoryId.position;
      }

      // If both have subcategories, sort by subcategory position
      if (a.subcategoryId && b.subcategoryId) {
        return a.subcategoryId.position - b.subcategoryId.position;
      }

      // If one of them lacks a subcategory, prioritize the one with a subcategory
      if (!a.subcategoryId && b.subcategoryId) return 1; // `a` goes after `b`
      if (a.subcategoryId && !b.subcategoryId) return -1; // `a` goes before `b`

      return 0; // If both don't have subcategories, maintain order
    });

    // Apply pagination after sorting
    const totalProducts = products.length;
    const paginatedProducts = products.slice((page - 1) * limit, page * limit);

    // Get the total count of products for pagination calculation
    // const totalProducts = await Product.countDocuments();

    res.status(200).json({
      success: true,
      message: "All products fetched successfully",
      data: paginatedProducts,
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

export const getAllNewProducts = async (req, res) => {
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

export const downloadExcelSheet = async (req, res) => {
  try {
    // Step 1: Fetch data from MongoDB
    const products = await Product.find({ isDeleted: false }).populate(
      "categoryId"
    );

    // Step 2: Prepare the data for Excel
    const data = products.map((product) => ({
      Name: product.name,
      Image: product.image,
      Price: product.price,
      Duration: product.duration,
      Category: product.categoryId ? product.categoryId.name : "NA",
      Options:
        product.options.length > 0
          ? product.options
              .map(
                (opt) =>
                  `Option: ${opt.option}, Price: ${opt.price}, Active: ${opt.isActive}`
              )
              .join("; ")
          : "NA",
      Details: product.details,
      New: product.isnew ? "Yes" : "No",
      BestSeller: product.isBestSeller ? "Yes" : "No",
      DiscountPercentage: product.discountPercentage,
      FinalPrice: product.finalPrice,
      Rating: product.rating,
      Active: product.isActive ? "Active" : "Inactive",
      CreatedAt: product.createdAt.toISOString(),
      UpdatedAt: product.updatedAt.toISOString(),
    }));

    // Step 3: Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    // Step 4: Generate the Excel file as a buffer (in-memory)
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    // Step 5: Set the appropriate headers for file download
    res.setHeader("Content-Disposition", "attachment; filename=products.xlsx");
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

export const searchProduct = async (req, res) => {
  try {
    const { query } = req.query;

    // Handle pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Define search conditions using case-insensitive regex for text fields
    // and exact match or number conversion for numeric fields (e.g., price)
    let searchCondition = {};

    if (query) {
      searchCondition = {
        $or: [
          { name: { $regex: query, $options: "i" } }, // Case-insensitive search for product name
          { "options.option": { $regex: query, $options: "i" } }, // Search within options array (option field)
          { details: { $regex: query, $options: "i" } }, // Search in product details
        ],
      };
    }

    // Find the products matching the search condition
    const products = await Product.find(searchCondition)
      .limit(limit)
      .skip(skip)
      .lean();

    // Check if no products are found
    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found",
      });
    }

    const totalProducts = await Product.countDocuments(searchCondition);

    // Return the search results along with pagination details
    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: products,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error while searching products:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while searching products",
      errorMessage: error.message,
    });
  }
};
