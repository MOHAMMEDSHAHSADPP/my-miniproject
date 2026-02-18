// back/Models/RServiceRequest.js
const mongoose = require("mongoose");

const RServiceRequestSchema = new mongoose.Schema(
  {
    townSlug: {
      type: String,
      required: true,
      index: true,
    },

    ward: {
      type: String,
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["gas", "waste", "water", "electricity"],
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "rejected"],
      default: "open",
    },

    history: [
      {
        status: String,
        note: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("RServiceRequest", RServiceRequestSchema);
