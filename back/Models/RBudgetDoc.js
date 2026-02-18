// back/Models/RBudgetDoc.js
const mongoose = require("mongoose");

const RBudgetDocSchema = new mongoose.Schema(
  {
    townSlug: { type: String, required: true, index: true },

    title: { type: String, required: true },
    description: { type: String, default: "" },

    fileUrl: { type: String, default: "" }, // PDF or document
    year: { type: String, default: "" },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RBudgetDoc", RBudgetDocSchema);
