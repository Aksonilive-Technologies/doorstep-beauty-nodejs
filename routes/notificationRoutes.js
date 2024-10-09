const express = require("express");
const {
  createNotification,
  getNotifications,
  //   getNotificationById,
  updateNotification,
  deleteNotification,
  searchNotification,
} = require("../controller/notificationController");
const { uploadSingleImage } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/create", uploadSingleImage, createNotification);
router.get("/fetch/all", getNotifications);
// router.get("/fetchbyId",  getNotificationById);
router.put("/update", uploadSingleImage, updateNotification);
router.put("/delete", deleteNotification);
router.get("/search-notification", searchNotification);

module.exports = router;
