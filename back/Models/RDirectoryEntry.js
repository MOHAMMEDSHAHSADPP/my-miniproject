// back/Models/RDirectoryEntry.js
const mongoose = require("mongoose");

const RDirectoryEntrySchema = new mongoose.Schema(
  {
    townSlug: { type: String, required: true, index: true },
    ward: { type: String, default: "" }, // optional ward-scoped

    category: {
      type: String,
      required: true,
      trim: true,
      // examples: plumber, electrician, hospital, police, fire, taxi, carpenter
    },

    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },

    // extra details that chatbot can show
    details: { type: String, default: "" },

    tags: [{ type: String }],

    isActive: { type: Boolean, default: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

RDirectoryEntrySchema.index({ townSlug: 1, category: 1 });

module.exports = mongoose.model("RDirectoryEntry", RDirectoryEntrySchema);
