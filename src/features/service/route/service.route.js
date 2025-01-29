const express = require("express");
router = express.Router();
const Service = require("../controller/serviceController");



router.post("/create", Service.createService);
router.put("/update", Service.updateService);
router.get("/fetch/single", Service.getServiceById);
router.delete("/delete", Service.deleteService);
router.get("/fetch/all", Service.getAllServices);






module.exports = router