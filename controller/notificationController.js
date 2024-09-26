const { default: mongoose } = require("mongoose");
const { cloudinary } = require("../config/cloudinary.js");
const Notification = require("../models/notificationModel.js");
const admin = require("firebase-admin");
const Partner = require("../models/partnerModel.js");
const Customer = require("../models/customerModel.js");
const FirebaseToken = require("../models/firebaseTokenModel.js");
const nodeCron = require("node-cron");
const partnerServiceAccount = JSON.parse(
  process.env.PartnerFCMServiceAccountKey
);
const customerServiceAccount = JSON.parse(
  process.env.CustomerFCMServiceAccountKey
);

// Initialize Firebase Apps only if they are not already initialized
const partnerAppName = "partnerApp";
const customerAppName = "customerApp";

let partnerApp;
let customerApp;

if (!admin.apps.some((app) => app.name === partnerAppName)) {
  partnerApp = admin.initializeApp(
    {
      credential: admin.credential.cert(partnerServiceAccount),
    },
    partnerAppName
  );
} else {
  partnerApp = admin.app(partnerAppName);
}

if (!admin.apps.some((app) => app.name === customerAppName)) {
  customerApp = admin.initializeApp(
    {
      credential: admin.credential.cert(customerServiceAccount),
    },
    customerAppName
  );
}

// Function to send notifications
const sendNotification = async (notification) => {
  try {
    const { title, body, image, targetAudience, audienceType } = notification;

    // Fetch FCM tokens for the specified userType and targetAudience
    const tokens = await FirebaseToken.find({
      userId: { $in: targetAudience }, // Match user IDs from targetAudience
      userType: audienceType, // Match audience type: "customer" or "partner"
      isActive: true,
      isDeleted: false,
    });

    // Send notifications to each token using the appropriate app
    if (tokens && tokens.length > 0) {
      for (const token of tokens) {
        const message = {
          notification: {
            title,
            body,
            image,
          },
          token: token.token,
        };

        if (audienceType === "partner") {
          await partnerApp.messaging().send(message);
        } else if (audienceType === "customer") {
          await customerApp.messaging().send(message);
        }
      }
    }
  } catch (error) {
    console.error("Error sending notification: ", error.message);
  }
};

// Schedule a notification using cron
const scheduleNotification = (notification) => {
  const { notificationDate, notificationTime } = notification;

  // Combine the notification date and time into a single Date object
  const scheduledTime = new Date(`${notificationDate}T${notificationTime}:00`);

  const currentTime = new Date();
  const timeDiff = scheduledTime - currentTime;

  if (timeDiff > 0) {
    // Schedule the notification using cron
    const cronExpression = `${scheduledTime.getMinutes()} ${scheduledTime.getHours()} ${scheduledTime.getDate()} ${
      scheduledTime.getMonth() + 1
    } *`;

    nodeCron.schedule(cronExpression, async () => {
      console.log("Sending notification: ", notification.title);
      await sendNotification(notification);
    });

    console.log("Notification scheduled for: ", scheduledTime);
  } else {
    console.log(
      "Scheduled time is in the past, sending notification immediately."
    );
    sendNotification(notification); // Send immediately if the time has already passed
  }
};

// Create a new notification
exports.createNotification = async (req, res) => {
  try {
    const {
      title,
      body,
      targetAudience, // Assume this is an array of user IDs
      audienceType, // Enum: "customer" or "partner"
      notificationDate,
      notificationTime,
    } = req.body;

    // Check if all required fields are present
    if (
      !title ||
      !body ||
      !audienceType || // Ensures audience type is provided
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

    // Save the notification in the database
    await notification.save();

    // Schedule the notification to be sent at the given date and time
    scheduleNotification(notification);

    // Respond with success
    res.status(201).json({
      success: true,
      message: "Notification created and scheduled",
      data: notification,
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({
      success: false,
      message: "Error while creating the notification",
      error: error.message,
    });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, showAll = false } = req.query;

    // Parse pagination parameters
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

    const populatedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        const populatedAudience = await Promise.all(
          notification.targetAudience.map(async (id) => {
            // Check if id is a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(id)) {
              console.log(`Invalid ObjectId: ${id}`); // Log invalid IDs
              return null; // Skip invalid ObjectId
            }

            // Attempt to fetch audience based on audienceType
            let audience;
            if (notification.audienceType === "customer") {
              audience = await Customer.findById(id);
            } else if (notification.audienceType === "partner") {
              audience = await Partner.findById(id);
            }

            // Log whether audience was found
            if (!audience) {
              console.log(
                `No audience found for ID: ${id} (Type: ${notification.audienceType})`
              );
            } else {
              console.log(`Audience found for ID ${id}:`, audience);
            }

            return audience
              ? {
                  _id: audience._id,
                  name: audience.name,
                  userType: notification.audienceType,
                }
              : null;
          })
        );

        // Log populated audience before filtering
        console.log(
          `Populated audience for notification ${notification._id}:`,
          populatedAudience
        );

        return {
          ...notification.toObject(),
          targetAudience: populatedAudience.filter(Boolean),
        };
      })
    );

    res.status(200).json({
      success: true,
      data: populatedNotifications,
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
