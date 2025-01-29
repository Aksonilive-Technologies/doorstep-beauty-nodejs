const express = require("express");
const router = express.Router();
const app = express();
const {
  register,
  login,
  allAdmin,
  deleteAdmin,
  updateAdminPassword,
  updateAdminRole,
  changeStatus,
  downloadExcelSheet,
  searchAdmin,
} = require("../controller/admin.controller");
const verifyToken = require("../../../../middleware/verifyToken");

router.post("/register", register);
router.post("/login", login);

router.get("/all", verifyToken, allAdmin);
router.put("/toggle/status", verifyToken, changeStatus);
router.put("/delete", verifyToken, deleteAdmin);
router.post("/update/password", updateAdminPassword);
router.post("/update/role", verifyToken, updateAdminRole);
router.get("/download-excel", verifyToken, downloadExcelSheet);
router.get("/searchAdmin", verifyToken, searchAdmin);

module.exports = router;
