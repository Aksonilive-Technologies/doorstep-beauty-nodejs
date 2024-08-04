const moongoose = require("mongoose");

const categoriesSchema = new moongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            default: "https://st3.depositphotos.com/15648834/17930/v/450/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg",
            required: true,
        },

        type: {
            type: String,
            default: "category",
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
const Categories = moongoose.model("Categories", categoriesSchema);

module.exports = Categories
