// back/Models/RComplaint.js
const mongoose = require("mongoose");

const RComplaintSchema = new mongoose.Schema(
  {
    townSlug: {
      type: String,
      required: true,
      index: true,
    },

    ward: {
      type: String,
      default: "",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["water", "road", "waste", "electricity", "other"],
      default: "other",
    },

    description: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
    },

    adminNote: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RComplaint", RComplaintSchema);
