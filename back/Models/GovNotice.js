const mongoose = require("mongoose");

const GovNoticeSchema = new mongoose.Schema(
  {
    townSlug: { type: String, required: true, index: true },
    townName: { type: String, default: "" },

    title: { type: String, required: true },
    description: { type: String, default: "" },
    deadline: { type: Date, default: null },

    priority: { type: String, default: "normal" },
    isActive: { type: Boolean, default: true },
    acknowledgedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("GovNotice", GovNoticeSchema);