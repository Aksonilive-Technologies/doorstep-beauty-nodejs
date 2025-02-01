const Customer = require("../../customer/model/customer.model.js");
const FirebaseToken = require("../model/firebase-token.model.js");

exports.updateFirebaseToken = async (req, res) => {
  const { userId, token, userType, deviceType } = req.body;

  try {
    // Check if all required fields are provided
    if (!userId || !token || !userType || !deviceType) {
      return res.status(400).json({
        success: false,
        message: "Fields like userId, token, userType, deviceType are required",
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
      // const partner = await Partner.findById({ userId });
      //   // if (!partner) {
      //   return res.status(400).json({
      //     success: false,
      //     message: "Partner not found",
      //     errorMessage: error.message,
      //   });
      //   // }
    }

    // Find an existing token for the given user and device type
    let firebaseToken = await FirebaseToken.findOne({
      userId,
      deviceType,
      isActive: true,
      isDeleted: false,
    });

    // If no token exists, create a new one
    if (!firebaseToken) {
      firebaseToken = await FirebaseToken.create({
        userId,
        token,
        userType,
        deviceType,
      });
      await firebaseToken.save(); // Save the new token

      // Respond with success
      return res.status(200).json({
        success: true,
        message: "Token added successfully.",
        data: firebaseToken,
      });
    } else {
      // If token exists but is different from the provided token, update it
      if (firebaseToken.token !== token) {
        firebaseToken.token = token; // Update the token
        await firebaseToken.save(); // Save the updated token

        // Respond with success
        return res.status(200).json({
          success: true,
          message: "Token updated successfully.",
          data: firebaseToken,
        });
      } else {
        // If the token is the same as the provided token, no update is required
        return res.status(200).json({
          success: true,
          message: "No updates required.",
          data: null,
        });
      }
    }
  } catch (error) {
    console.error("Error updating token:", error);
    res.status(500).json({
      success: false,
      message: "Error updating token",
      errorMessage: error.message,
    });
  }
};
