import express from "express";
import {
  createOffer,
  getOffers,
  deleteOffer,
  changeOfferStatus,
  searchOffers,
} from "../controller/offer-admin.controller.js";
import "../cronJob.js";
import { uploadSingleImage } from "../../../../middleware/uploadMiddleware.js";
const router = express.Router();

router.post("/create", uploadSingleImage, createOffer);
router.get("/fetch/all", getOffers);
router.put("/delete", deleteOffer);
router.put("/change-status", changeOfferStatus);
router.get("/search", searchOffers);

export default router;
