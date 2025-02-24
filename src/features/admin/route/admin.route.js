import express from "express";
const router = express.Router();
import {
  register,
  registerSuperadmin,
  login,
  allAdmin,
  deleteAdmin,
  updateAdminPassword,
  updateAdmin,
  changeStatus,
  downloadExcelSheet,
  searchAdmin,
} from "../controller/admin.controller.js";
import verifyToken from "../../../../middleware/verifyToken.js";

router.post("/register", register);
router.post("/register-superadmin", registerSuperadmin);
router.post("/login", login);

router.get("/all", verifyToken, allAdmin);
router.put("/toggle/status", verifyToken, changeStatus);
router.put("/delete", verifyToken, deleteAdmin);
router.post("/update/password", updateAdminPassword);
router.put("/update", verifyToken, updateAdmin);
router.get("/download-excel", verifyToken, downloadExcelSheet);
router.get("/searchAdmin", verifyToken, searchAdmin);

export default router;
