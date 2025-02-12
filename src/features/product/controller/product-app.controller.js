import * as Product from "../model/product.model.js";

// Fetch all products
export const getAllNewProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      isDeleted: false,
      isnew: true,
    })
      .sort({ createdAt: -1 })
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

export const getAllCategoryProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      isDeleted: false,
    })
      .populate("categoryId")
      .populate("subcategoryId")
      .select("-__v");

    // Group products by category and subcategory
    const groupedData = {};

    products.forEach((product) => {
      const categoryId = product.categoryId._id.toString();
      const subcategoryId = product.subcategoryId
        ? product.subcategoryId._id.toString()
        : null;

      // Initialize category if not present
      if (!groupedData[categoryId]) {
        groupedData[categoryId] = {
          ...product.categoryId.toObject(),
          subcategory: [],
          products: [],
        };
      }

      // If subcategory exists, add to subcategory array
      if (subcategoryId) {
        let subcategory = groupedData[categoryId].subcategory.find(
          (sub) => sub._id.toString() === subcategoryId
        );

        if (!subcategory) {
          subcategory = {
            ...product.subcategoryId.toObject(),
            products: [],
          };
          groupedData[categoryId].subcategory.push(subcategory);
        }

        subcategory.products.push(product.toObject());
      } else {
        // If no subcategory, push the product directly under the category
        groupedData[categoryId].products.push(product.toObject());
      }
    });

    // Convert grouped data into an array and sort categories by position
    // Convert grouped data into an array and sort categories, subcategories, and products
    const formattedData = Object.values(groupedData)
      .map((category) => ({
        ...category,
        subcategory: category.subcategory
          .map((sub) => ({
            ...sub,
            products: sub.products.sort((a, b) => a.position - b.position), // Sort products inside subcategory
          }))
          .sort((a, b) => a.position - b.position), // Sort subcategories
        products: category.products.sort((a, b) => a.position - b.position), // Sort products directly under category
      }))
      .sort((a, b) => a.position - b.position); // Sort categories

    res.status(200).json({
      success: true,
      message: "All products fetched and grouped successfully",
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      errorMessage: error.message,
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      isDeleted: false,
    })
      .populate("categoryId")
      .populate("subcategoryId")
      .select("-__v");

    // Group products by category and subcategory
    const groupedData = {};

    products.forEach((product) => {
      const categoryId = product.categoryId._id.toString();
      const subcategoryId = product.subcategoryId
        ? product.subcategoryId._id.toString()
        : null;

      // Initialize category if not present
      if (!groupedData[categoryId]) {
        groupedData[categoryId] = {
          ...product.categoryId.toObject(),
          subcategory: [],
          products: [],
        };
      }

      // If subcategory exists, add to subcategory array
      if (subcategoryId) {
        let subcategory = groupedData[categoryId].subcategory.find(
          (sub) => sub._id.toString() === subcategoryId
        );

        if (!subcategory) {
          subcategory = {
            ...product.subcategoryId.toObject(),
            products: [],
          };
          groupedData[categoryId].subcategory.push(subcategory);
        }

        subcategory.products.push(product.toObject());
      } else {
        // If no subcategory, push the product directly under the category
        groupedData[categoryId].products.push(product.toObject());
      }
    });

    // Convert grouped data into an array and sort categories by position
    // Convert grouped data into an array and sort categories, subcategories, and products
    const formattedData = Object.values(groupedData)
      .map((category) => ({
        ...category,
        subcategory: category.subcategory
          .map((sub) => ({
            ...sub,
            products: sub.products.sort((a, b) => a.position - b.position), // Sort products inside subcategory
          }))
          .sort((a, b) => a.position - b.position), // Sort subcategories
        products: category.products.sort((a, b) => a.position - b.position), // Sort products directly under category
      }))
      .sort((a, b) => a.position - b.position); // Sort categories

    res.status(200).json({
      success: true,
      message: "All products fetched and grouped successfully",
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      errorMessage: error.message,
    });
  }
};
