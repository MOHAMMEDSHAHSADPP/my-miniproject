// back/Utils/notify.js
const RNotification = require("../Models/RNotification");

/**
 * Create a notification for a specific user.
 * @param {string} userId
 * @param {object} opts - { title, message, type, priority, townSlug, ward, link, meta }
 */
async function notifyUser(userId, opts = {}) {
  try {
    if (!userId) return null;
    return await RNotification.create({
      userId,
      title: opts.title || "",
      message: opts.message || "",
      type: opts.type || "info",
      priority: opts.priority || "normal",
      townSlug: opts.townSlug || "",
      ward: opts.ward || "",
      link: opts.link || "",
      meta: opts.meta || {},
    });
  } catch (e) {
    console.error("⚠️ notifyUser failed:", e.message);
    return null;
  }
}

module.exports = { notifyUser };
