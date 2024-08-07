const express = require("express");
const router = express.Router();
const app = express();
const {
  register,
  login,
  allAdmin,
  deleteAdmin,
  updateAdmin,
  changeStatus,
} = require("../controller/adminController");
const verifyToken = require("../middleware/verifyToken");

router.post("/register", register);
router.post("/login", login);

router.get("/all", verifyToken, allAdmin);
router.put("/status", verifyToken, changeStatus);
router.put("/delete", verifyToken, deleteAdmin);
router.put("/update", verifyToken, updateAdmin);

module.exports = router;
