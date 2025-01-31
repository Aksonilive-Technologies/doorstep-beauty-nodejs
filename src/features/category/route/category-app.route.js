const express = require("express");
const router = express.Router();
const categoryAppController = require("../controller/category-app.controller");

router.get("/fetch/all", categoryAppController.getAllCategories);

module.exports = router;
