const mongoose = require("mongoose");

const TravelSchema = new mongoose.Schema(
  {
    townSlug: { type: String, required: true, index: true },
    townName: { type: String, default: "" },

    type: { type: String, default: "other" }, // bus/train/taxi/auto/other
    title: { type: String, required: true },
    details: { type: String, default: "" },
    mapUrl: { type: String, default: "" },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Travel", TravelSchema);
