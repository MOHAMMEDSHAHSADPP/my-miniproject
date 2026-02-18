const mongoose = require("mongoose");

const AnnouncementSchema = new mongoose.Schema(
  {
    // town scope
    townSlug: {
      type: String,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },

    startDate: {
      type: String, // YYYY-MM-DD
    },

    endDate: {
      type: String, // YYYY-MM-DD
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Announcement", AnnouncementSchema);