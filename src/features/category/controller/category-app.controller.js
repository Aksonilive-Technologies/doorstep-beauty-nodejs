import Category from "../model/category.model.js";

// need to modify
export const getAllCategories = async (req, res) => {
  try {
    // Find categories with pagination
    const categories = await Category.find({ isActive: true, isDeleted: false })
      .select("-__v")
      .sort({ position: 1 })
      .lean(); // Use lean for better performance

    // Populate each category with related products and packages
    //   for (const category of categories) {
    //     const products = await Product.find({
    //       categoryId: category._id,
    //       isDeleted: false,
    //       isActive: true,
    //     }).select("-__v")
    //     .populate('subcategoryId');

    //     // Sort products by subcategory position first and then product position
    // products.sort((a, b) => {
    //   // If both have subcategories, compare based on subcategory position
    //   if (a.subcategoryId && b.subcategoryId) {
    //     return a.subcategoryId.position - b.subcategoryId.position || a.position - b.position;
    //   }
    //   // If one product has a subcategory and the other doesn't, give priority to the product with a subcategory
    //   if (a.subcategoryId) {
    //     return -1; // a comes first
    //   }
    //   if (b.subcategoryId) {
    //     return 1; // b comes first
    //   }
    //   // If neither has a subcategory, compare by product position within the category
    //   return a.position - b.position;
    // });
    //     category.products = products;
    //   }

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
