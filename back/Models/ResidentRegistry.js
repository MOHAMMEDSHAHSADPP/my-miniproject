// back/Models/ResidentRegistry.js
const mongoose = require("mongoose");

const ResidentRegistrySchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    houseNo: { type: String, required: true, trim: true },
    ward: { type: String, required: true, trim: true },
    dob: { type: String, default: "" },

    familyHeadName: { type: String, default: "" },
    voterId: { type: String, required: true, trim: true },

    townName: { type: String, required: true, trim: true },
    townSlug: { type: String, required: true, trim: true },

    isClaimed: { type: Boolean, default: false },
    claimedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    claimedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Prevent duplicate preload records within the same town
ResidentRegistrySchema.index({ voterId: 1, townSlug: 1 }, { unique: true });

module.exports = mongoose.model("ResidentRegistry", ResidentRegistrySchema);