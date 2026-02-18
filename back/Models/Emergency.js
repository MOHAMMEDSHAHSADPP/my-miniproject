const mongoose = require("mongoose");

const EmergencySchema = new mongoose.Schema(
  {
    townSlug: {
      type: String,
      required: true,
      index: true,
    },

    label: {
      type: String,
      required: true,
      trim: true, // Police / Fire / Ambulance etc
    },

    number: {
      type: String,
      required: true,
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Emergency", EmergencySchema);