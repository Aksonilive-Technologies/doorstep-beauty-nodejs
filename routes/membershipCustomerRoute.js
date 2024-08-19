// customersRoute.js
const express = require("express");


const router = express.Router();

router.post("/create", createMembership);
// router.put("/update", updateMembership);
router.get("/fetch/all", fetchAllMemberships);

module.exports = router;
