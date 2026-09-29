const Notification = require("../models/Notification");

/**
 * Create a notification without allowing notification failures to break
 * the primary business operation.
 */
async function createNotification({
  userId,
  title,
  message,
  type = "system",
  data = {},
}) {
  if (!userId || !title || !message) return null;

  try {
    return await Notification.create({
      user: userId,
      title: String(title).trim(),
      message: String(message).trim(),
      type,
      data,
      isRead: false,
    });
  } catch (error) {
    console.error("Notification creation failed:", error.message);
    return null;
  }
}

module.exports = { createNotification };
