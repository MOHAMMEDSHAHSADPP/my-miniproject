// back/Models/RMessage.js
const mongoose = require("mongoose");

const RMessageSchema = new mongoose.Schema(
  {
    townSlug: { type: String, required: true, index: true },

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RChatRoom",
      required: true,
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    text: { type: String, default: "" },

    // optional attachment (image)
    image: { type: String, default: "" },

    // message visibility
    isHiddenByAdmin: { type: Boolean, default: false },
    hiddenReason: { type: String, default: "" },

    // per-user delete (“delete for me”)
    hiddenFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // reporting system
    isReported: { type: Boolean, default: false },
    reportCount: { type: Number, default: 0 },
    reports: [
      {
        byUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("RMessage", RMessageSchema);
