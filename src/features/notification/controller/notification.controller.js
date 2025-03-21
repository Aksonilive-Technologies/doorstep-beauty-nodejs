import mongoose from "mongoose";
import { cloudinary } from "../../../../config/cloudinary.js";
import Notification from "../model/notification.model.js";
import Partner from "../../partner/model/partner.model.js";
import Customer from "../../customer/model/customer.model.js";
import FirebaseToken from "../../firebase-token/model/firebase-token.model.js";
import nodeCron from "node-cron";
import moment from "moment-timezone";
import {
  sendPartnerNotification,
} from "../../../../helper/partnerFcmService.js";
import {
  sendCustomerNotification,
} from "../../../../helper/customerFcmService.js";

// Function to send notifications
const sendNotification = async (notification) => {
  try {
    const { title, body, targetAudience, audienceType } = notification;

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
        if (audienceType === "partner") {
          await sendPartnerNotification(token.token, title, body);
        } else if (audienceType === "customer") {
          await sendCustomerNotification(token.token, title, body);
        }
      }
    }
  } catch (error) {
    console.error("Error sending notification: ", error.message);
  }
};

// Helper function to convert 12-hour time to 24-hour format if necessary
const convertTimeTo24HourFormat = (time12h) => {
  const [time, modifier] = time12h.split(" ");

  let [hours, minutes] = time.split(":");

  if (hours === "12") {
    hours = "00";
  }

  if (modifier === "PM") {
    hours = parseInt(hours, 10) + 12;
  }

  return `${hours}:${minutes}`;
};

const scheduleNotification = (notification) => {
  let { notificationDate, notificationTime } = notification;

  // Convert notificationTime from 12-hour to 24-hour format
  notificationTime = convertTimeTo24HourFormat(notificationTime);

  // Convert the provided notificationDate and notificationTime from IST to UTC
  const scheduledTimeIST = moment.tz(
    `${notificationDate} ${notificationTime}`,
    "YYYY-MM-DD HH:mm",
    "Asia/Kolkata" // Input is in IST
  );

  // Validate the scheduled time
  if (!scheduledTimeIST.isValid()) {
    console.error("Invalid scheduled time due to date or time format.");
    return;
  }

  // Convert IST scheduled time to UTC for comparison with current time
  const scheduledTimeUTC = scheduledTimeIST.clone().tz("UTC");
  const currentTimeUTC = moment().utc();

  const timeDiff = scheduledTimeUTC.diff(currentTimeUTC, "minutes"); // Difference in minutes

  // console.log(
  `Scheduled Time (IST): ${scheduledTimeIST.format()}, Time Diff: ${timeDiff} minutes`;
  // );

  // Schedule the notification in IST timezone using cron
  const cronExpression = `${scheduledTimeIST.minutes()} ${scheduledTimeIST.hours()} ${scheduledTimeIST.date()} ${
    scheduledTimeIST.month() + 1
  } *`;

  // console.log("Cron Expression: ", cronExpression);

  nodeCron.schedule(
    cronExpression,
    async () => {
      // console.log("Sending notification: ", notification.title);
      await sendNotification(notification);
    },
    {
      timezone: "Asia/Kolkata", // Ensure cron runs in IST timezone
    }
  );

  // console.log(`Notification scheduled for: ${scheduledTimeIST.format()} IST`);
};

// Create a new notification
export const createNotification = async (req, res) => {
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
      const baseFolder = process.env.CLOUDINARY_BASE_FOLDER || "";

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: baseFolder + "notification",
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

export const getNotifications = async (req, res) => {
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

    let notifications, totalCount, totalPages;

    if (showAll === "true") {
      notifications = await Notification.find();
      totalCount = notifications.length;
      totalPages = 1;
    } else {
      const skip = (pageNumber - 1) * limitNumber;

      notifications = await Notification.find().skip(skip).limit(limitNumber);

      totalCount = await Notification.countDocuments();
      totalPages = Math.ceil(totalCount / limitNumber);
    }

    const populatedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        const populatedAudience = await Promise.all(
          notification.targetAudience.map(async (id) => {
            // Check if id is a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(id)) {
              // console.log(`Invalid ObjectId: ${id}`); // Log invalid IDs
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
              // console.log(
              //   `No audience found for ID: ${id} (Type: ${notification.audienceType})`
              // );
            } else {
              // console.log(`Audience found for ID ${id}:`, audience);
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
        // console.log(
        //   `Populated audience for notification ${notification._id}:`,
        //   populatedAudience
        // );

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

export const updateNotification = async (req, res) => {
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
      const notification = await Notification.findById(id);
      const baseFolder = process.env.CLOUDINARY_BASE_FOLDER || "";

      // Delete the existing image from Cloudinary
      const publicId = notification.image.split("/").pop().split(".")[0]; // Extract public_id from URL
      await cloudinary.uploader.destroy(
        `${baseFolder}notification/${publicId.replace(/%20/g, " ")}`
      );

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: baseFolder + "notification",
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

    scheduleNotification(notification);

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

export const deleteNotification = async (req, res) => {
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
