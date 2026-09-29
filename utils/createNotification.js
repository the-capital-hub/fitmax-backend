const Notification = require("../models/Notification");

async function createNotification({ recipient, sender = null, type = "System", title, message, link = "" }) {
  if (!recipient || !title || !message) return null;
  try {
    return await Notification.create({ recipient, sender, type, title, message, link });
  } catch (error) {
    console.error("Notification creation error:", error.message);
    return null;
  }
}

module.exports = createNotification;
