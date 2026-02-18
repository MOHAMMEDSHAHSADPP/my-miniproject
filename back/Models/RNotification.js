const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    townSlug: { type: String, required: true },
    ward: { type: String, default: "" },

    // null = broadcast
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    type: {
      type: String,
      enum: ["info", "warning", "emergency", "reminder"],
      default: "info",
    },

    priority: {
      type: String,
      enum: ["low", "normal", "high", "critical"],
      default: "normal",
    },

    title: String,
    message: String,
    link: String,

    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
