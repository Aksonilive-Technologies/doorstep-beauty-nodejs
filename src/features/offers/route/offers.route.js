import express from "express";
import {
  createOffer,
  getOffers,
  deleteOffer,
  changeOfferStatus,
  searchOffers,
} from "../controller/offers.controller.js";
const router = express.Router();

router.post("/create", createOffer);
router.get("/fetch/all", getOffers);
router.put("/delete", deleteOffer);
router.put("/change-status", changeOfferStatus);
router.get("/search-offer", searchOffers);

export default router;
