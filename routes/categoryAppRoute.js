const express = require("express");
const router = express.Router();
const categoryAppController = require("../controller/categoryAppController");

router.get("/fetch/all", categoryAppController.getAllCategories);

module.exports = router;
