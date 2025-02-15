const admin = require("./firebase");

const sendNotification = async (token, title, body, data = {}) => {
    if (!token) {
        console.log("No FCM token provided");
        return;
    }

    const message = {
        notification: { title, body },
        token,
        data, // Datos adicionales (opcional)
    };

    try {
        const response = await admin.messaging().send(message);
        console.log("Notification sent successfully:", response);
    } catch (error) {
        console.error("Error sending notification:", error);
    }
};

module.exports = sendNotification;
