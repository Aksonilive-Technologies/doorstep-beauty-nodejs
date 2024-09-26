const admin1 = require("firebase-admin");
const customerServiceAccount = JSON.parse(
  process.env.CustomerFCMServiceAccountKey
);

// Initialize Firebase App for Customer
const customerApp = admin1.initializeApp(
  {
    credential: admin1.credential.cert(customerServiceAccount),
  },
  "customerApp"
); // Alias for customer app

// Send a notification message to the customer
exports.sendCustomerNotification = (token, title, body, image) => {
  const message = {
    notification: {
      title,
      body,
      image: image || undefined, // Optional image
    },
    token: token,
  };

  return customerApp
    .messaging()
    .send(message)
    .then((response) => {
      console.log("Successfully sent notification to customer:", response);
      return response;
    })
    .catch((error) => {
      console.error("Error sending notification to customer:", error);
      throw error;
    });
};

// Send booking confirmation message to customer
exports.sendBookingConfirmationMessage = (token) => {
  const message = {
    notification: {
      title: "Booking Confirmed",
      body: "Your booking has been confirmed successfully!",
    },
    token: token,
  };

  return customerApp
    .messaging()
    .send(message)
    .then((response) => {
      console.log("Successfully sent confirmation to customer:", response);
      return response;
    })
    .catch((error) => {
      console.error("Error sending confirmation to customer:", error);
      throw error;
    });
};

// Send partner allocation message to customer
exports.sendPartnerAllocationConfirmationMessage = (token) => {
  const message = {
    notification: {
      title: "Partner Allocated",
      body: "A partner has been allocated to your booking!",
    },
    token: token,
  };

  return customerApp
    .messaging()
    .send(message)
    .then((response) => {
      console.log("Successfully sent allocation to customer:", response);
      return response;
    })
    .catch((error) => {
      console.error("Error sending allocation to customer:", error);
      throw error;
    });
};

// Send booking cancellation message to customer
exports.sendBookingCancellationMessage = (token) => {
  const message = {
    notification: {
      title: "Booking Cancelled",
      body: "Your booking has been cancelled successfully!",
    },
    token: token,
  };

  return customerApp
    .messaging()
    .send(message)
    .then((response) => {
      console.log("Successfully sent cancellation to customer:", response);
      return response;
    })
    .catch((error) => {
      console.error("Error sending cancellation to customer:", error);
      throw error;
    });
};

// Send booking refund message to customer
exports.sendBookingRefundMessage = (token) => {
  const message = {
    notification: {
      title: "Booking Refund",
      body: "Your booking amount has been refunded successfully!",
    },
    token: token,
  };

  return customerApp
    .messaging()
    .send(message)
    .then((response) => {
      console.log("Successfully sent refund to customer:", response);
      return response;
    })
    .catch((error) => {
      console.error("Error sending refund to customer:", error);
      throw error;
    });
};
