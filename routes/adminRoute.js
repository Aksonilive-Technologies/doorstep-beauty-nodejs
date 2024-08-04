const express = require("express");
const router = express.Router();
const app = express();
const {
    register,
    login,
    allAdmin,
    deleteAdmin,
    updateAdmin,
    changeStatus
  } = require("../controller/adminController"); 
  


router.post("/register",register); 
router.post("/login",login);
router.get("/all", allAdmin);
router.get("/status", changeStatus)
router.put("/delete", deleteAdmin);
router.put("/update", updateAdmin);



module.exports = router