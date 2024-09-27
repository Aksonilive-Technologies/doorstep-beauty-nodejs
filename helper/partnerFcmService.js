const admin2 = require("firebase-admin");
const partnerServiceAccount = JSON.parse(
  process.env.PartnerFCMServiceAccountKey
);

// Initialize Firebase App for Partner
const partnerApp = admin2.initializeApp(
  {
    credential: admin2.credential.cert(partnerServiceAccount),
  },
  "partnerApp"
); // Alias for partner app

// Send a notification message to the partner
exports.sendPartnerNotification = (token, title, body) => {
  const message = {
    notification: {
      title,
      body,
    },
    token: token,
  };

  return partnerApp
    .messaging()
    .send(message)
    .then((response) => {
      console.log("Successfully sent notification to partner:", response);
      return response;
    })
    .catch((error) => {
      console.error("Error sending notification to partner:", error);
      throw error;
    });
};

// Send notification for new booking to partner
exports.sendNewBookingMessage = (token) => {
  const message = {
    notification: {
      title: "New Booking",
      body: "You have a new booking request!",
    },
    token: token,
  };

  return partnerApp
    .messaging()
    .send(message)
    .then((response) => {
      console.log("Successfully sent message to partner:", response);
      return response;
    })
    .catch((error) => {
      console.error("Error sending message to partner:", error);
      throw error;
    });
};

// Send booking confirmation message to partner
exports.sendBookingConfirmationMessage = (token) => {
  const message = {
    notification: {
      title: "Booking Confirmed",
      body: "Your booking has been confirmed successfully!",
    },
    token: token,
  };

  return partnerApp
    .messaging()
    .send(message)
    .then((response) => {
      console.log("Successfully sent confirmation to partner:", response);
      return response;
    })
    .catch((error) => {
      console.error("Error sending confirmation to partner:", error);
      throw error;
    });
};

// Send booking cancellation message to partner
exports.sendBookingCancellationMessage = (token) => {
  const message = {
    notification: {
      title: "Booking Cancelled",
      body: "Your booking has been cancelled successfully!",
    },
    token: token,
  };

  return partnerApp
    .messaging()
    .send(message)
    .then((response) => {
      console.log("Successfully sent cancellation to partner:", response);
      return response;
    })
    .catch((error) => {
      console.error("Error sending cancellation to partner:", error);
      throw error;
    });
};
