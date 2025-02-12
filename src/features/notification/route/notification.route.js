import express from "express";
import {
  createNotification,
  getNotifications,
  //   getNotificationById,
  updateNotification,
  deleteNotification,
  searchNotification,
} from "../controller/notification.controller.js";
import { uploadSingleImage } from "../../../../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/create", uploadSingleImage, createNotification);
router.get("/fetch/all", getNotifications);
// router.get("/fetchbyId",  getNotificationById);
router.put("/update", uploadSingleImage, updateNotification);
router.put("/delete", deleteNotification);
router.get("/search-notification", searchNotification);

export default router;
