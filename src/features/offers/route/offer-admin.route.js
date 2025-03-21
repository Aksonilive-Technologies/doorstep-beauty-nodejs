import express from "express";
import {
  createOffer,
  getOffers,
  deleteOffer,
  changeOfferStatus,
  searchOffers,
} from "../controller/offer-admin.controller.js";
import "../cronJob.js";
const router = express.Router();

router.post("/create", createOffer);
router.get("/fetch/all", getOffers);
router.put("/delete", deleteOffer);
router.put("/change-status", changeOfferStatus);
router.get("/search", searchOffers);

export default router;
