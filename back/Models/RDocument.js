// back/Models/RDocument.js
const mongoose = require("mongoose");

const RDocumentSchema = new mongoose.Schema(
  {
    townSlug: { type: String, required: true, index: true },
    ward: { type: String, required: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    docType: {
      type: String,
      enum: ["aadhaar", "ration", "voter_id", "pan", "other"],
      required: true,
    },

    title: { type: String, default: "" },

    // stored file path: /uploads/resident/....
    fileUrl: { type: String, required: true },

    // admin can request, then user uploads -> marked fulfilled
    requestedByAdmin: { type: Boolean, default: false },
    requestNote: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "submitted", "approved", "rejected"],
      default: "submitted",
    },

    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RDocument", RDocumentSchema);
