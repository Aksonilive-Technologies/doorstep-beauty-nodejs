const express = require("express");
const router = express.Router();
const categoryController = require("../controller/categoryController");
router.get("/fetch/all", categoryController.getAllCategoriesAdmin);

module.exports = router;
