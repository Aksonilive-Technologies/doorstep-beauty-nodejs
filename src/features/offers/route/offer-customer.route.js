import express from "express";
import {
  getOfferByCode,
  getOffers,
} from "../controller/offer-customer.controller.js";
const router = express.Router();

router.get("/fetch/by-code", getOfferByCode);
router.get("/fetch/all", getOffers);

export default router;