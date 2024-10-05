const express = require("express");
const {
  createOffer,
  getOffers,
  deleteOffer,
  changeOfferStatus,
  searchOffers,
} = require("../controller/offerController");
const router = express.Router();

router.post("/create", createOffer);
router.get("/fetch/all", getOffers);
router.put("/delete", deleteOffer);
router.put("/change-status", changeOfferStatus);
router.get("/search-offer", searchOffers);

module.exports = router;
