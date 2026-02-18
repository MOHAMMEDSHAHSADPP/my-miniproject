const mongoose = require("mongoose");

const ComplaintSchema = new mongoose.Schema(
  {
    townSlug: {
      type: String,
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["complaint", "suggestion"],
      default: "complaint",
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // visitor details (no login needed)
    fromName: {
      type: String,
      default: "",
      trim: true,
    },

    fromEmail: {
      type: String,
      default: "",
      trim: true,
    },

    fromPhone: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
    },

    adminNote: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", ComplaintSchema);