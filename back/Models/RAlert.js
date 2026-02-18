// back/Models/RAlert.js
const mongoose = require("mongoose");

const RAlertSchema = new mongoose.Schema(
  {
    townSlug: {
      type: String,
      required: true,
      index: true,
    },

    ward: {
      type: String,
      default: "", // empty = entire town
    },

    type: {
      type: String,
      enum: ["fire", "theft", "missing", "disaster", "warning", "info"],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
    },

    priority: {
      type: String,
      enum: ["low", "normal", "high", "critical"],
      default: "high",
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RAlert", RAlertSchema);
