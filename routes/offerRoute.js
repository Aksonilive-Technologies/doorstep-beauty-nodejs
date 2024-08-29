const express = require("express");
const { createOffer, getOffers, deleteOffer, changeOfferStatus } = require("../controller/offerController");
const router = express.Router();

router.post("/create", createOffer);
router.get("/fetch/all", getOffers);
router.put("/delete", deleteOffer);
router.patch("/change-status", changeOfferStatus);

module.exports = router;
