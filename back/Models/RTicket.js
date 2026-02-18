// back/Models/RTicket.js
const mongoose = require("mongoose");

const RTicketSchema = new mongoose.Schema(
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

    subject: {
      type: String,
      required: true,
      trim: true,
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
      enum: ["open", "viewing", "in_progress", "on_hold", "resolved", "closed"],
      default: "open",
    },

    adminNote: {
      type: String,
      default: "",
    },

    messages: [
      {
        sender: { type: String, enum: ["user", "admin"], required: true },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("RTicket", RTicketSchema);
