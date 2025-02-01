const AppVersion = require("../model/app-version.model.js");
const Customer = require("../../customer/model/customer.model.js");
const Partner = require("../../partner/model/partner.model.js");

exports.updateAppVersion = async (req, res) => {
  const { userId, appVersion, userType, deviceType } = req.body;

  try {
    // Check if all required fields are provided
    if (!userId || !appVersion || !userType || !deviceType) {
      return res.status(400).json({
        success: false,
        message:
          "Fields like userId, appVersion, userType, and deviceType are required",
      });
    }

    if (userType === "customer") {
      const customer = await Customer.findById(userId);

      if (!customer) {
        // console.log("Customer not found for ID:", userId);
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }
    } else {
      const partner = await Partner.findById(userId);
      if (!partner) {
        return res.status(400).json({
          success: false,
          message: "Partner not found",
          errorMessage: error.message,
        });
      }
    }

    // Find an existing app version record for the given user and device type
    let app_version = await AppVersion.findOne({
      userId,
      deviceType,
      isActive: true,
      isDeleted: false,
    });

    // If no app version record exists, create a new one
    if (!app_version) {
      app_version = await AppVersion.create({
        userId,
        appVersion,
        userType,
        deviceType,
      });
      await app_version.save(); // Save the new app version record

      // Respond with success
      return res.status(200).json({
        success: true,
        message: "App version added successfully.",
        data: app_version,
      });
    } else {
      // If appVersion exists but is different from the provided appVersion, update it
      if (app_version.appVersion !== appVersion) {
        app_version.appVersion = appVersion; // Update the appVersion
        await app_version.save(); // Save the updated app version record

        // Respond with success
        return res.status(200).json({
          success: true,
          message: "App version updated successfully.",
          data: app_version,
        });
      } else {
        // If the appVersion is the same as the provided appVersion, no update is required
        return res.status(200).json({
          success: true,
          message: "No updates required.",
          data: null,
        });
      }
    }
  } catch (error) {
    console.error("Error updating app version:", error);
    res.status(500).json({
      success: false,
      message: "Error updating app version",
      errorMessage: error.message,
    });
  }
};
