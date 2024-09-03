const { default: mongoose } = require("mongoose");
const { cloudinary } = require("../config/cloudinary.js");
const Notification = require("../models/notificationModel.js");

// need to approve
// Create a new notification
exports.createNotification = async (req, res) => {
  try {
    const {
      title,
      body,
      targetAudience,
      audienceType,
      notificationDate,
      notificationTime,
    } = req.body;

    // Check if all required fields are present
    if (
      !title ||
      !body ||
      !audienceType ||
      !notificationDate ||
      !notificationTime
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    let imageUrl;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "notification",
        public_id: `${Date.now()}_${req.file.originalname.split(".")[0]}`,
        overwrite: true,
      });
      imageUrl = result.secure_url;
    }

    // Create the notification
    const notification = new Notification({
      title,
      body,
      targetAudience,
      audienceType,
      notificationDate,
      notificationTime,
      image: imageUrl || undefined, // Include the imageUrl if available
    });

    // Save the notification
    await notification.save();

    // Respond with success
    res.status(201).json({
      success: true,
      data: notification,
      message: "Successfully created notification",
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({
      success: false,
      message: "Error while creating the message",
      error: error.message,
    });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, showAll = false } = req.query;

    // Parse pagination parameters outside the conditional block
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Validation for pagination parameters
    if (
      isNaN(pageNumber) ||
      isNaN(limitNumber) ||
      pageNumber <= 0 ||
      limitNumber <= 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid pagination parameters" });
    }

    const filter = {
      isActive: true,
      isDeleted: false,
    };

    let notifications, totalCount, totalPages;

    if (showAll === "true") {
      notifications = await Notification.find(filter);
      totalCount = notifications.length;
      totalPages = 1;
    } else {
      const skip = (pageNumber - 1) * limitNumber;

      notifications = await Notification.find(filter)
        .skip(skip)
        .limit(limitNumber);

      totalCount = await Notification.countDocuments(filter);
      totalPages = Math.ceil(totalCount / limitNumber);
    }

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        currentPage: showAll === "true" ? 1 : pageNumber,
        totalPages,
        totalCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error occurred while fetching notifications",
      error: error.message,
    });
  }
};

exports.updateNotification = async (req, res) => {
  try {
    const { id } = req.query;
    const { title, body, targetAudience, notificationDate, notificationTime } =
      req.body;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid notification ID" });
    }

    // Upload image if file is provided
    let imageUrl;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "notification",
        public_id: `${Date.now()}_${req.file.originalname.split(".")[0]}`,
        overwrite: true,
      });
      imageUrl = result.secure_url;
    }

    // Prepare the data to be updated
    const updateData = {
      title,
      body,
      targetAudience,
      notificationDate,
      notificationTime,
    };
    // If an image was uploaded, include it in the update
    if (imageUrl) {
      updateData.image = imageUrl;
    }

    // Find and update the notification by ID
    const notification = await Notification.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    // If the notification is not found, return a 404 error
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    // Return success response with the updated notification
    res.status(200).json({
      success: true,
      data: notification,
      message: "Notification updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating notification",
      error: error.message,
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.query;

    // Validate query parameters
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing notification ID",
      });
    }

    // Mark the notification as deleted
    const notification = await Notification.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true } },
      { new: true }
    );

    // Handle case where notification is not found
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Successfully deleted
    res.status(200).json({
      success: true,
      data: notification,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error while deleting the notification",
      error: error.message,
    });
  }
};
