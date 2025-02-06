const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            required: true,
        },
        position: {
            type: Number,
            required: true,
          },
        price: {
            type: Number,
            required: true,
        },
        duration: {
            type: String,
            required: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Categories",
            required: true,
        },
        subcategoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subcategories"
        },
        details: {
            type: String,
            required: true,
        },
        isnew: {
            type: Boolean,
            default: true,
        },
        isBestSeller: {
            type: Boolean,
            default: false,
        },
        discountPercentage: {
            type: Number,
            default: 0,
        },
        finalPrice : {
            type: Number
        },
        rating: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);
const Product = mongoose.model("Product", productSchema);

module.exports = Product
