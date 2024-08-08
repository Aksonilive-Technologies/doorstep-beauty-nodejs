const moongoose = require("mongoose");

const categoriesSchema = new moongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoWwwz1wz7ps1CwKr4BKfEWFY4CCJ91o0lwQ&s",
      // required: true,
    },
    // position rakhna hai type ke jagah pe
    type: {
      type: String,
      default: "category",
    },
    position: {
      type: Number,
      required: true,
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

module.exports = Categories;
