const Notification = require("../models/Notification");

/**
 * Create a notification without allowing notification failures to break
 * the primary business operation.
 */
async function createNotification({
  userId,
  title,
  message,
  type = "System",
  link = "",
  sender = null,
}) {
  if (!userId || !title || !message) return null;

  try {
    return await Notification.create({
      recipient: userId,
      sender,
      title: String(title).trim(),
      message: String(message).trim(),
      type,
      link,
      read: false,
    });
  } catch (error) {
    console.error("Notification creation failed:", error.message);
    return null;
  }
}

module.exports = { createNotification };
