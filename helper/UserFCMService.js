import admin from "firebase-admin";

// Send notification for created notifications to users
export const sendNotificationToUser = (token, title, body) => {
  const message = {
    notification: {
      title: title,
      body: body,
    },
    token: token,
  };

  return admin
    .messaging()
    .send(message)
    .then((response) => {
      // console.log("Successfully sent message:", response);
      return response;
    })
    .catch((error) => {
      console.error("Error sending message:", error);
      throw error;
    });
};
